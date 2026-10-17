from __future__ import annotations

import hashlib
import http.client
import tempfile
import threading
import unittest
from http.server import ThreadingHTTPServer
from pathlib import Path

from dg_production import (
    Ledger,
    LedgerError,
    make_handler,
    require_loopback,
    run_worker_once,
)


class ProductionLedgerTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.base = Path(self.temp.name)
        self.data = self.base / "ledger-data"
        self.assets = self.base / "assets"
        self.assets.mkdir()
        self.ledger = Ledger(self.data)

    def tearDown(self) -> None:
        self.temp.cleanup()

    def register(self, path: str = "book/source.txt") -> int:
        return self.ledger.add_asset("A careful draft", path, "Canonical source for private review", True, "unknown")

    def test_registration_starts_private_and_creates_audit_event(self) -> None:
        asset_id = self.register()
        asset = self.ledger.asset(asset_id)
        self.assertEqual(asset["state"], "private")
        self.assertEqual(asset["verification_state"], "not_checked")
        self.assertEqual(asset["product_inclusion"], 1)
        _, _, events = self.ledger.dashboard_data()
        self.assertEqual(events[0]["event_type"], "asset_registered")

    def test_path_traversal_and_absolute_paths_are_rejected(self) -> None:
        for path in ("../outside.txt", "book/../../outside.txt", "/tmp/outside.txt", "book\\outside.txt", "book//file.txt"):
            with self.subTest(path=path), self.assertRaises(LedgerError):
                self.ledger.add_asset("Draft", path, "Review", False, "unknown")

    def test_release_states_are_owner_records_and_require_explicit_confirmation(self) -> None:
        asset_id = self.register()
        with self.assertRaises(LedgerError):
            self.ledger.set_state(asset_id, "approved", owner_confirmed=False)
        self.ledger.set_state(asset_id, "candidate", owner_confirmed=False)
        self.ledger.set_state(asset_id, "approved", owner_confirmed=True)
        self.assertEqual(self.ledger.asset(asset_id)["state"], "approved")
        _, _, events = self.ledger.dashboard_data()
        change = next(event for event in events if event["event_type"] == "owner_state_changed")
        self.assertIn('"owner_confirmed": true', change["details_json"])

    def test_worker_hashes_only_registered_file_and_never_changes_release_state(self) -> None:
        (self.assets / "book").mkdir()
        content = b"private DG source bytes\n"
        (self.assets / "book/source.txt").write_bytes(content)
        asset_id = self.register()
        self.ledger.set_state(asset_id, "candidate", owner_confirmed=False)
        job_id = self.ledger.queue_job(asset_id, "verify_asset")

        self.assertTrue(run_worker_once(self.ledger, self.assets))
        self.assertFalse(run_worker_once(self.ledger, self.assets))
        asset = self.ledger.asset(asset_id)
        self.assertEqual(asset["state"], "candidate")
        self.assertEqual(asset["verification_state"], "verified")
        self.assertEqual(asset["sha256"], hashlib.sha256(content).hexdigest())
        self.assertEqual(asset["size_bytes"], len(content))
        jobs = self.ledger.dashboard_data()[1]
        job = next(item for item in jobs if item["id"] == job_id)
        self.assertEqual(job["status"], "completed")

    def test_worker_rejects_symlink_that_escapes_asset_root(self) -> None:
        outside = self.base / "outside.txt"
        outside.write_text("must not be read", encoding="utf-8")
        (self.assets / "escape.txt").symlink_to(outside)
        asset_id = self.register("escape.txt")
        self.ledger.queue_job(asset_id, "verify_asset")

        self.assertTrue(run_worker_once(self.ledger, self.assets))
        asset = self.ledger.asset(asset_id)
        self.assertEqual(asset["verification_state"], "failed")
        self.assertIsNone(asset["sha256"])
        self.assertEqual(asset["state"], "private")

    def test_worker_enforces_per_file_limit(self) -> None:
        (self.assets / "large.bin").write_bytes(b"0123456789")
        asset_id = self.register("large.bin")
        self.ledger.queue_job(asset_id, "verify_asset")
        run_worker_once(self.ledger, self.assets, max_file_bytes=5)
        self.assertEqual(self.ledger.asset(asset_id)["verification_state"], "failed")

    def test_interrupted_and_stale_jobs_can_be_retried(self) -> None:
        (self.assets / "retry.txt").write_text("try again", encoding="utf-8")
        asset_id = self.register("retry.txt")
        job_id = self.ledger.queue_job(asset_id, "verify_asset")
        claimed = self.ledger.claim_job()
        self.ledger.requeue_interrupted_job(claimed)
        self.assertTrue(run_worker_once(self.ledger, self.assets))

        stale_id = self.ledger.queue_job(asset_id, "verify_asset")
        stale_claim = self.ledger.claim_job()
        self.assertEqual(stale_claim["id"], stale_id)
        with self.ledger.connect() as db:
            db.execute("UPDATE jobs SET started_at='2000-01-01T00:00:00+00:00' WHERE id=?", (stale_id,))
        recovered = self.ledger.claim_job()
        self.assertEqual(recovered["id"], stale_id)
        self.assertNotEqual(recovered["id"], job_id)
        _, _, events = self.ledger.dashboard_data()
        self.assertTrue(any(event["event_type"] == "worker_job_recovered" for event in events))

    def test_unknown_job_type_cannot_be_queued(self) -> None:
        asset_id = self.register()
        with self.assertRaises(LedgerError):
            self.ledger.queue_job(asset_id, "shell")

    def test_loopback_binding_is_mandatory(self) -> None:
        require_loopback("127.0.0.1")
        with self.assertRaises(LedgerError):
            require_loopback("0.0.0.0")
        with self.assertRaises(LedgerError):
            require_loopback("192.168.1.12")

    def test_ledger_is_bound_to_one_asset_root(self) -> None:
        other_root = self.base / "other-assets"
        other_root.mkdir()
        self.ledger.bind_asset_root(self.assets)
        self.ledger.bind_asset_root(self.assets)
        with self.assertRaises(LedgerError):
            self.ledger.bind_asset_root(other_root)

    def test_owner_view_is_local_and_rejects_cross_origin_posts(self) -> None:
        asset_id = self.register()
        del asset_id
        port = self._free_port()
        server = ThreadingHTTPServer(("127.0.0.1", port), make_handler(self.ledger, port))
        server.daemon_threads = True
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            connection = http.client.HTTPConnection("127.0.0.1", port, timeout=3)
            connection.request("GET", "/")
            response = connection.getresponse()
            page = response.read().decode("utf-8")
            self.assertEqual(response.status, 200)
            self.assertIn("Production Ledger", page)
            self.assertIn("Content-Security-Policy", response.headers)

            connection.request("POST", "/assets", "title=Forged", {
                "Origin": "https://evil.example", "Content-Type": "application/x-www-form-urlencoded"
            })
            response = connection.getresponse()
            response.read()
            self.assertEqual(response.status, 403)
            self.assertEqual(len(self.ledger.dashboard_data()[0]), 1)

            connection.request("POST", "/assets", "title=Private+draft&relative_path=chapter.txt&purpose=Review&rights_status=unknown", {
                "Origin": f"http://127.0.0.1:{port}", "Content-Type": "application/x-www-form-urlencoded"
            })
            response = connection.getresponse()
            response.read()
            self.assertEqual(response.status, 303)
            self.assertEqual(len(self.ledger.dashboard_data()[0]), 2)
            connection.close()
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=3)

    @staticmethod
    def _free_port() -> int:
        import socket
        with socket.socket() as sock:
            sock.bind(("127.0.0.1", 0))
            return int(sock.getsockname()[1])


if __name__ == "__main__":
    unittest.main()
