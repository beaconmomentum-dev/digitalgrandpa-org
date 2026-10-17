#!/usr/bin/env python3
"""Private Digital Grandpa production ledger and bounded local file worker.

This tool is intentionally local-only. The worker can hash one explicitly
registered file per queued job; it cannot run commands, alter files, approve
release states, or contact external services.
"""

from __future__ import annotations

import argparse
import hashlib
import html
import json
import os
import re
import sqlite3
import sys
import time
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path, PurePosixPath
from urllib.parse import parse_qs, urlsplit

STATES = {"private", "candidate", "approved", "blocked", "final"}
JOB_TYPES = {"verify_asset"}
MAX_FORM_BYTES = 16_384
DEFAULT_MAX_FILE_BYTES = 5 * 1024 * 1024 * 1024
DEFAULT_DATA_DIR = Path.home() / ".local" / "share" / "digital-grandpa-production"


class LedgerError(ValueError):
    """Invalid owner input or ledger operation."""


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def relative_asset_path(value: str) -> str:
    if not isinstance(value, str) or not value or len(value) > 1024:
        raise LedgerError("Enter a relative path under the configured asset directory.")
    if "\\" in value or value.startswith("/") or "\x00" in value:
        raise LedgerError("Asset paths must be relative POSIX paths.")
    parts = value.split("/")
    if any(part in {"", ".", ".."} for part in parts):
        raise LedgerError("Asset paths cannot contain empty, dot, or parent-directory segments.")
    path = PurePosixPath(value)
    if path.is_absolute():
        raise LedgerError("Asset paths must be relative.")
    return path.as_posix()


def _private_directory(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True, mode=0o700)
    try:
        path.chmod(0o700)
    except OSError:
        pass
    return path


class Ledger:
    """Small SQLite record of owner decisions, assets, and verification jobs."""

    def __init__(self, data_dir: Path):
        self.data_dir = _private_directory(data_dir.expanduser().resolve())
        self.db_path = self.data_dir / "ledger.sqlite3"
        self._initialize()

    def connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.db_path, timeout=10)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        connection.execute("PRAGMA busy_timeout = 10000")
        return connection

    def _initialize(self) -> None:
        with self.connect() as db:
            db.executescript(
                """
                PRAGMA journal_mode = WAL;
                CREATE TABLE IF NOT EXISTS assets (
                    id INTEGER PRIMARY KEY,
                    title TEXT NOT NULL,
                    relative_path TEXT NOT NULL UNIQUE,
                    purpose TEXT NOT NULL,
                    product_inclusion INTEGER NOT NULL DEFAULT 0 CHECK(product_inclusion IN (0, 1)),
                    rights_status TEXT NOT NULL DEFAULT 'unknown',
                    state TEXT NOT NULL DEFAULT 'private'
                        CHECK(state IN ('private','candidate','approved','blocked','final')),
                    verification_state TEXT NOT NULL DEFAULT 'not_checked'
                        CHECK(verification_state IN ('not_checked','verified','failed')),
                    sha256 TEXT,
                    size_bytes INTEGER,
                    last_checked_at TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS jobs (
                    id INTEGER PRIMARY KEY,
                    asset_id INTEGER NOT NULL REFERENCES assets(id),
                    job_type TEXT NOT NULL CHECK(job_type IN ('verify_asset')),
                    status TEXT NOT NULL DEFAULT 'queued'
                        CHECK(status IN ('queued','processing','completed','failed')),
                    requested_at TEXT NOT NULL,
                    started_at TEXT,
                    finished_at TEXT,
                    result_json TEXT
                );
                CREATE TABLE IF NOT EXISTS events (
                    id INTEGER PRIMARY KEY,
                    asset_id INTEGER REFERENCES assets(id),
                    job_id INTEGER REFERENCES jobs(id),
                    event_type TEXT NOT NULL,
                    details_json TEXT NOT NULL DEFAULT '{}',
                    created_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS jobs_status_id ON jobs(status, id);
                CREATE INDEX IF NOT EXISTS events_created_at ON events(id DESC);
                """
            )
        try:
            self.db_path.chmod(0o600)
        except OSError:
            pass

    def bind_asset_root(self, root: Path) -> None:
        """Bind this ledger once to the same explicit local source directory."""
        canonical = str(root.expanduser().resolve(strict=True))
        with self.connect() as db:
            existing = db.execute("SELECT value FROM settings WHERE key='asset_root'").fetchone()
            if existing and existing["value"] != canonical:
                raise LedgerError("This ledger is already bound to a different asset root. Use the original directory or a separate data directory.")
            db.execute("INSERT OR IGNORE INTO settings(key,value) VALUES('asset_root',?)", (canonical,))

    def _event(self, db: sqlite3.Connection, event_type: str, asset_id: int | None,
               details: dict, job_id: int | None = None) -> None:
        db.execute(
            "INSERT INTO events(asset_id, job_id, event_type, details_json, created_at) VALUES(?,?,?,?,?)",
            (asset_id, job_id, event_type, json.dumps(details, sort_keys=True), utc_now()),
        )

    def add_asset(self, title: str, relative_path: str, purpose: str,
                  product_inclusion: bool, rights_status: str) -> int:
        title, purpose = title.strip(), purpose.strip()
        path = relative_asset_path(relative_path.strip())
        allowed_rights = {"unknown", "owner_confirmed", "third_party_authorized", "not_applicable"}
        if not title or len(title) > 160:
            raise LedgerError("Title is required and must be 160 characters or fewer.")
        if not purpose or len(purpose) > 500:
            raise LedgerError("Purpose is required and must be 500 characters or fewer.")
        if rights_status not in allowed_rights:
            raise LedgerError("Choose a listed rights/source status.")
        now = utc_now()
        with self.connect() as db:
            cursor = db.execute(
                "INSERT INTO assets(title,relative_path,purpose,product_inclusion,rights_status,state,created_at,updated_at) VALUES(?,?,?,?,?,'private',?,?)",
                (title, path, purpose, int(product_inclusion), rights_status, now, now),
            )
            asset_id = int(cursor.lastrowid)
            self._event(db, "asset_registered", asset_id, {"state": "private"})
        return asset_id

    def set_state(self, asset_id: int, state: str, owner_confirmed: bool) -> None:
        if state not in STATES:
            raise LedgerError("Unknown production state.")
        if state in {"approved", "final"} and not owner_confirmed:
            raise LedgerError("An explicit owner confirmation is required for this state.")
        with self.connect() as db:
            row = db.execute("SELECT state FROM assets WHERE id=?", (asset_id,)).fetchone()
            if row is None:
                raise LedgerError("Asset not found.")
            db.execute("UPDATE assets SET state=?, updated_at=? WHERE id=?", (state, utc_now(), asset_id))
            self._event(db, "owner_state_changed", asset_id,
                        {"from": row["state"], "to": state, "owner_confirmed": bool(owner_confirmed)})

    def queue_job(self, asset_id: int, job_type: str) -> int:
        if job_type not in JOB_TYPES:
            raise LedgerError("This worker does not support that job type.")
        now = utc_now()
        with self.connect() as db:
            if db.execute("SELECT 1 FROM assets WHERE id=?", (asset_id,)).fetchone() is None:
                raise LedgerError("Asset not found.")
            cursor = db.execute(
                "INSERT INTO jobs(asset_id,job_type,status,requested_at) VALUES(?,?,'queued',?)",
                (asset_id, job_type, now),
            )
            job_id = int(cursor.lastrowid)
            self._event(db, "verification_queued", asset_id, {"job_type": job_type}, job_id)
        return job_id

    def claim_job(self) -> dict | None:
        with self.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            stale = db.execute(
                "SELECT id,asset_id FROM jobs WHERE status='processing' AND started_at IS NOT NULL AND datetime(started_at) < datetime('now','-1 day')"
            ).fetchall()
            for item in stale:
                db.execute("UPDATE jobs SET status='queued',started_at=NULL WHERE id=?", (item["id"],))
                self._event(db, "worker_job_recovered", item["asset_id"],
                            {"reason": "processing lease exceeded 24 hours"}, item["id"])
            row = db.execute(
                "SELECT id,asset_id,job_type FROM jobs WHERE status='queued' ORDER BY id LIMIT 1"
            ).fetchone()
            if row is None:
                db.commit()
                return None
            started = utc_now()
            db.execute("UPDATE jobs SET status='processing',started_at=? WHERE id=?", (started, row["id"]))
            db.commit()
            return {"id": row["id"], "asset_id": row["asset_id"], "job_type": row["job_type"]}

    def requeue_interrupted_job(self, job: dict) -> None:
        with self.connect() as db:
            updated = db.execute(
                "UPDATE jobs SET status='queued',started_at=NULL WHERE id=? AND status='processing'",
                (job["id"],),
            )
            if updated.rowcount:
                self._event(db, "worker_job_requeued", job["asset_id"],
                            {"reason": "worker stopped during verification"}, job["id"])

    def asset(self, asset_id: int) -> dict | None:
        with self.connect() as db:
            row = db.execute("SELECT * FROM assets WHERE id=?", (asset_id,)).fetchone()
            return dict(row) if row else None

    def finish_job(self, job: dict, result: dict) -> None:
        completed = bool(result.get("ok"))
        now = utc_now()
        status = "completed" if completed else "failed"
        with self.connect() as db:
            db.execute(
                "UPDATE jobs SET status=?,finished_at=?,result_json=? WHERE id=? AND status='processing'",
                (status, now, json.dumps(result, sort_keys=True), job["id"]),
            )
            if completed:
                db.execute(
                    "UPDATE assets SET verification_state='verified',sha256=?,size_bytes=?,last_checked_at=?,updated_at=? WHERE id=?",
                    (result["sha256"], result["size_bytes"], now, now, job["asset_id"]),
                )
            else:
                db.execute(
                    "UPDATE assets SET verification_state='failed',last_checked_at=?,updated_at=? WHERE id=?",
                    (now, now, job["asset_id"]),
                )
            self._event(db, "verification_finished", job["asset_id"], result, job["id"])

    def dashboard_data(self) -> tuple[list[dict], list[dict], list[dict]]:
        with self.connect() as db:
            assets = [dict(row) for row in db.execute("SELECT * FROM assets ORDER BY updated_at DESC,id DESC")]
            jobs = [dict(row) for row in db.execute(
                "SELECT j.*,a.title AS asset_title FROM jobs j JOIN assets a ON a.id=j.asset_id ORDER BY j.id DESC LIMIT 30"
            )]
            events = [dict(row) for row in db.execute(
                "SELECT e.*,a.title AS asset_title FROM events e LEFT JOIN assets a ON a.id=e.asset_id ORDER BY e.id DESC LIMIT 40"
            )]
        return assets, jobs, events


def verify_registered_file(root: Path, asset: dict, max_file_bytes: int) -> dict:
    """Read and hash one registered regular file, without changing it."""
    root = root.expanduser().resolve(strict=True)
    if not root.is_dir():
        raise LedgerError("Configured asset directory is not a directory.")
    relative = relative_asset_path(asset["relative_path"])
    candidate = root.joinpath(*PurePosixPath(relative).parts)
    resolved = candidate.resolve(strict=True)
    if not resolved.is_relative_to(root):
        raise LedgerError("Resolved asset path escapes the configured directory.")
    if not resolved.is_file():
        raise LedgerError("Registered asset is not a regular file.")
    before = resolved.stat()
    size = before.st_size
    if size > max_file_bytes:
        raise LedgerError(f"File exceeds the configured {max_file_bytes}-byte worker limit.")
    digest = hashlib.sha256()
    bytes_read = 0
    with resolved.open("rb") as stream:
        while chunk := stream.read(1024 * 1024):
            bytes_read += len(chunk)
            if bytes_read > max_file_bytes:
                raise LedgerError("File grew beyond the configured worker limit during verification.")
            digest.update(chunk)
    after = resolved.stat()
    if (before.st_size, before.st_mtime_ns, before.st_ino) != (after.st_size, after.st_mtime_ns, after.st_ino):
        raise LedgerError("File changed while it was being verified; queue a fresh check after edits stop.")
    return {"ok": True, "sha256": digest.hexdigest(), "size_bytes": bytes_read}


def run_worker_once(ledger: Ledger, asset_root: Path, max_file_bytes: int = DEFAULT_MAX_FILE_BYTES) -> bool:
    job = ledger.claim_job()
    if job is None:
        return False
    try:
        if job["job_type"] not in JOB_TYPES:
            result = {"ok": False, "error": "Unsupported worker job type."}
        else:
            asset = ledger.asset(job["asset_id"])
            if asset is None:
                raise LedgerError("Asset record no longer exists.")
            result = verify_registered_file(asset_root, asset, max_file_bytes)
        ledger.finish_job(job, result)
    except (OSError, LedgerError) as exc:
        ledger.finish_job(job, {"ok": False, "error": str(exc)[:500]})
    except KeyboardInterrupt:
        ledger.requeue_interrupted_job(job)
        raise
    return True


def esc(value: object) -> str:
    return html.escape(str(value if value is not None else ""), quote=True)


def render_dashboard(ledger: Ledger) -> bytes:
    assets, jobs, events = ledger.dashboard_data()
    asset_rows = []
    for asset in assets:
        checked = esc(asset["last_checked_at"] or "Not checked")
        inclusion = "Included" if asset["product_inclusion"] else "Not marked for inclusion"
        confirmation = '<label class="confirm"><input type="checkbox" name="owner_confirmed" value="yes"> I confirm this owner decision</label>'
        state_options = "".join(
            f'<option value="{state}"{" selected" if state == asset["state"] else ""}>{state.title()}</option>'
            for state in sorted(STATES)
        )
        asset_rows.append(f"""
          <article class="asset">
            <div class="asset-heading"><div><h3>{esc(asset['title'])}</h3><code>{esc(asset['relative_path'])}</code></div><span class="pill">{esc(asset['state'])}</span></div>
            <p>{esc(asset['purpose'])}</p><div class="meta">{esc(inclusion)} · Rights/source: <strong>{esc(asset['rights_status'].replace('_',' '))}</strong></div>
            <div class="meta">Verification: <strong>{esc(asset['verification_state'])}</strong> · Last checked: {checked}<br>SHA-256: <code>{esc(asset['sha256'] or '—')}</code> · {esc(asset['size_bytes'] if asset['size_bytes'] is not None else '—')} bytes</div>
            <div class="actions"><form method="post" action="/assets/{asset['id']}/verify"><button>Queue file verification</button></form>
              <form method="post" action="/assets/{asset['id']}/status" class="state-form"><label>Owner state <select name="state">{state_options}</select></label>{confirmation}<button class="secondary">Record state</button></form></div>
          </article>""")
    if not asset_rows:
        asset_rows.append('<p class="empty">No assets are recorded yet. Register a private source below to begin.</p>')
    job_rows = "".join(
        f"<tr><td>#{esc(j['id'])}</td><td>{esc(j['asset_title'])}</td><td>{esc(j['job_type'])}</td><td>{esc(j['status'])}</td><td>{esc(j['requested_at'])}</td><td>{esc((j['result_json'] or '')[:240])}</td></tr>"
        for j in jobs
    ) or '<tr><td colspan="6">No jobs yet.</td></tr>'
    event_rows = "".join(
        f"<tr><td>{esc(e['created_at'])}</td><td>{esc(e['event_type'])}</td><td>{esc(e['asset_title'] or '—')}</td><td><code>{esc(e['details_json'])}</code></td></tr>"
        for e in events
    ) or '<tr><td colspan="4">No recorded events yet.</td></tr>'
    page = f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DG Production Ledger · Owner View</title>
<style>
:root{{--ink:#142d45;--blue:#214c70;--amber:#d59b39;--paper:#f5f1e8;--card:#fffdf8;--muted:#65717d;--line:#ded8ca}}*{{box-sizing:border-box}}body{{margin:0;background:var(--paper);color:var(--ink);font:16px/1.55 system-ui,-apple-system,Segoe UI,sans-serif}}header{{background:var(--ink);color:#fff;padding:28px max(24px,calc((100vw - 1080px)/2))}}header h1{{margin:0;font:600 clamp(1.6rem,4vw,2.2rem) Georgia,serif}}header p{{margin:.35rem 0 0;color:#e9d9b6}}main{{max-width:1080px;margin:auto;padding:28px 20px 56px}}section{{margin:0 0 34px}}h2{{font:600 1.5rem Georgia,serif;margin:0 0 12px}}h3{{margin:0;font-size:1.14rem}}.notice{{padding:12px 15px;background:#fff3d6;border-left:4px solid var(--amber);border-radius:4px;margin-bottom:24px}}.asset{{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:20px;margin:12px 0;box-shadow:0 3px 12px #142d4509}}.asset-heading{{display:flex;justify-content:space-between;gap:12px;align-items:start}}code{{overflow-wrap:anywhere;font-size:.86em}}.pill{{background:#e8eef2;padding:4px 10px;border-radius:20px;text-transform:capitalize;white-space:nowrap}}.meta{{color:var(--muted);font-size:.92rem;margin:8px 0}}.actions{{display:flex;gap:14px;flex-wrap:wrap;align-items:end;margin-top:15px}}form{{margin:0}}.state-form{{display:flex;gap:10px;flex-wrap:wrap;align-items:end;padding:10px;background:#f3f0e8;border-radius:7px}}label{{display:block;font-size:.9rem;font-weight:600}}input,select,button{{font:inherit}}input[type=text],select{{display:block;padding:8px;border:1px solid #aeb7bd;border-radius:5px;background:white;max-width:100%}}button{{border:0;border-radius:5px;background:var(--blue);color:white;padding:9px 13px;font-weight:650;cursor:pointer}}button:hover{{background:var(--ink)}}button.secondary{{background:#5b6570}}.confirm{{font-weight:400;font-size:.82rem;max-width:180px}}.register{{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;background:var(--card);border:1px solid var(--line);padding:20px;border-radius:10px}}.register .wide{{grid-column:1/-1}}.register button{{justify-self:start}}.checkline{{display:flex;gap:8px;align-items:center}}table{{width:100%;border-collapse:collapse;background:var(--card);font-size:.88rem}}th,td{{border-bottom:1px solid var(--line);padding:9px;text-align:left;vertical-align:top}}th{{background:#e9e5dc}}.table-wrap{{overflow-x:auto}}.empty{{color:var(--muted)}}footer{{color:var(--muted);border-top:1px solid var(--line);padding-top:14px;font-size:.9rem}}@media(max-width:650px){{.register{{grid-template-columns:1fr}}.register .wide{{grid-column:auto}}.state-form{{align-items:stretch;flex-direction:column}}}}
</style></head><body><header><h1>Digital Grandpa · Production Ledger</h1><p>A quiet, private owner view for caring for the work.</p></header><main>
<div class="notice"><strong>Local-only workspace.</strong> The worker only verifies registered files and records checksums. It does not edit assets, approve releases, publish, contact readers, or connect to Phoenix, Signalman, or external services.</div>
<section><h2>Production assets</h2>{''.join(asset_rows)}</section>
<section><h2>Register a private asset</h2><form method="post" action="/assets" class="register">
<label>Asset title<input type="text" name="title" maxlength="160" required></label><label>Path under the configured asset directory<input type="text" name="relative_path" placeholder="books/title/source.docx" maxlength="1024" required></label>
<label class="wide">Purpose / product-inclusion context<input type="text" name="purpose" maxlength="500" required></label><label>Rights/source status<select name="rights_status"><option value="unknown">Unknown — needs review</option><option value="owner_confirmed">Owner-confirmed</option><option value="third_party_authorized">Third-party authorized</option><option value="not_applicable">Not applicable</option></select></label>
<label class="checkline"><input type="checkbox" name="product_inclusion" value="yes"> Intended for product inclusion (owner-marked)</label><button class="wide">Register as private</button></form></section>
<section><h2>Worker queue</h2><p class="meta">The worker must be started separately. Supported task: SHA-256 and size verification of one registered regular file at a time.</p><div class="table-wrap"><table><thead><tr><th>Job</th><th>Asset</th><th>Type</th><th>Status</th><th>Requested</th><th>Result</th></tr></thead><tbody>{job_rows}</tbody></table></div></section>
<section><h2>Owner audit trail</h2><div class="table-wrap"><table><thead><tr><th>Time (UTC)</th><th>Event</th><th>Asset</th><th>Details</th></tr></thead><tbody>{event_rows}</tbody></table></div></section>
<footer>Private owner tool. “Approved” and “Final” are recorded owner states only; they do not authorize publication, sale, delivery, or external action.</footer></main></body></html>"""
    return page.encode("utf-8")


def is_loopback_host(host: str) -> bool:
    return host.strip("[]").lower() in {"127.0.0.1", "localhost", "::1"}


def make_handler(ledger: Ledger, port: int):
    class Handler(BaseHTTPRequestHandler):
        server_version = "DGProductionLedger/1.0"

        def log_message(self, _format: str, *args: object) -> None:
            return

        def _send(self, status: int, body: bytes = b"", location: str | None = None) -> None:
            self.send_response(status)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Referrer-Policy", "no-referrer")
            self.send_header("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'")
            if location:
                self.send_header("Location", location)
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            if body:
                self.wfile.write(body)

        def _host_ok(self) -> bool:
            try:
                parsed = urlsplit("//" + self.headers.get("Host", ""))
                return is_loopback_host(parsed.hostname or "") and parsed.port == port
            except ValueError:
                return False

        def _origin_ok(self) -> bool:
            origin = self.headers.get("Origin")
            if origin is None:
                return True
            try:
                parsed = urlsplit(origin)
                return parsed.scheme == "http" and is_loopback_host(parsed.hostname or "") and parsed.port == port and parsed.path == "" and not parsed.query and not parsed.fragment
            except ValueError:
                return False

        def do_GET(self) -> None:
            if not self._host_ok():
                self._send(421, b"Local host only.")
                return
            if urlsplit(self.path).path != "/":
                self._send(404, b"Not found.")
                return
            self._send(200, render_dashboard(ledger))

        def do_POST(self) -> None:
            if not self._host_ok() or not self._origin_ok():
                self._send(403, b"Local owner request required.")
                return
            try:
                length = int(self.headers.get("Content-Length", "0"))
            except ValueError:
                length = MAX_FORM_BYTES + 1
            if length < 0 or length > MAX_FORM_BYTES:
                self._send(413, b"Form too large.")
                return
            try:
                payload = parse_qs(self.rfile.read(length).decode("utf-8"), max_num_fields=20)
                path = urlsplit(self.path).path
                if path == "/assets":
                    ledger.add_asset(
                        payload.get("title", [""])[0], payload.get("relative_path", [""])[0],
                        payload.get("purpose", [""])[0], payload.get("product_inclusion", [""])[0] == "yes",
                        payload.get("rights_status", ["unknown"])[0],
                    )
                else:
                    match = re.fullmatch(r"/assets/(\d+)/(verify|status)", path)
                    if not match:
                        self._send(404, b"Not found.")
                        return
                    asset_id, action = int(match.group(1)), match.group(2)
                    if action == "verify":
                        ledger.queue_job(asset_id, "verify_asset")
                    else:
                        ledger.set_state(asset_id, payload.get("state", [""])[0], payload.get("owner_confirmed", [""])[0] == "yes")
                self._send(303, location="/")
            except (LedgerError, UnicodeDecodeError, ValueError) as exc:
                self._send(400, f"<h1>Not saved</h1><p>{esc(exc)}</p><p><a href=\"/\">Return to owner view</a></p>".encode("utf-8"))
            except sqlite3.IntegrityError:
                self._send(400, b"Not saved. The path may already be registered.")

    return Handler


def require_asset_root(path: Path) -> Path:
    root = path.expanduser().resolve(strict=True)
    if not root.is_dir():
        raise LedgerError("The configured asset root must be an existing directory.")
    return root


def require_loopback(host: str) -> None:
    if host != "127.0.0.1":
        raise LedgerError("Owner view can only bind to 127.0.0.1.")


def add_data_arg(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--data-dir", type=Path, default=Path(os.environ.get("DG_LEDGER_DATA_DIR", DEFAULT_DATA_DIR)),
                        help=f"private local database directory (default: {DEFAULT_DATA_DIR})")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Private DG production ledger and constrained local worker")
    subparsers = parser.add_subparsers(dest="command", required=True)
    init = subparsers.add_parser("init", help="initialize the private SQLite ledger")
    add_data_arg(init)
    serve = subparsers.add_parser("serve", help="run the owner view on loopback")
    add_data_arg(serve)
    serve.add_argument("--assets-dir", type=Path, required=True, help="existing private root for production source files")
    serve.add_argument("--host", default="127.0.0.1", help="loopback only")
    serve.add_argument("--port", type=int, default=8765)
    worker = subparsers.add_parser("worker", help="process allowlisted local verification jobs")
    add_data_arg(worker)
    worker.add_argument("--assets-dir", type=Path, required=True, help="same existing private root used by serve")
    worker.add_argument("--once", action="store_true", help="process at most one queued task and exit")
    worker.add_argument("--poll-seconds", type=int, default=3, help="idle delay in poll mode (1–300)")
    worker.add_argument("--max-file-bytes", type=int, default=DEFAULT_MAX_FILE_BYTES,
                        help=f"per-file verification limit (default: {DEFAULT_MAX_FILE_BYTES})")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        ledger = Ledger(args.data_dir)
        if args.command == "init":
            print(f"Private ledger initialized at {ledger.db_path}")
            return 0
        root = require_asset_root(args.assets_dir)
        ledger.bind_asset_root(root)
        if args.command == "serve":
            require_loopback(args.host)
            if not 1 <= args.port <= 65535:
                raise LedgerError("Port must be between 1 and 65535.")
            server = ThreadingHTTPServer((args.host, args.port), make_handler(ledger, args.port))
            server.daemon_threads = True
            print(f"Owner view: http://127.0.0.1:{args.port}/ (Ctrl-C to stop)", flush=True)
            try:
                server.serve_forever()
            except KeyboardInterrupt:
                print("\nOwner view stopped.")
            finally:
                server.server_close()
            return 0
        if args.command == "worker":
            if args.max_file_bytes <= 0:
                raise LedgerError("Max file size must be positive.")
            if not args.once and not 1 <= args.poll_seconds <= 300:
                raise LedgerError("Poll interval must be between 1 and 300 seconds.")
            if args.once:
                processed = run_worker_once(ledger, root, args.max_file_bytes)
                print("Processed one queued verification." if processed else "No queued work.")
                return 0
            print("DG worker running: verify_asset only; Ctrl-C to stop.", flush=True)
            while True:
                if not run_worker_once(ledger, root, args.max_file_bytes):
                    time.sleep(args.poll_seconds)
    except (LedgerError, OSError, sqlite3.Error) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
