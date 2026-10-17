# Digital Grandpa local production ledger

A small, private owner tool for tracking production assets, release-readiness states, file checksums, and an audit trail. It uses only Python's standard library and SQLite.

## Safety and scope

- **Local only:** the owner view binds to `127.0.0.1`; non-loopback binds are rejected. It is not an internet/LAN service and has no login or multi-user model.
- **Private by default:** SQLite lives outside the repository at `~/.local/share/digital-grandpa-production/ledger.sqlite3` with a private data directory. Point `--data-dir` at another private directory if needed.
- **Separate private asset root:** files are not copied into the repository or database. The operator explicitly selects an existing local asset directory at startup.
- **Consistent root:** the ledger binds to the canonical asset-root path on first `serve` or `worker` start. Both commands must use that same directory; a different root requires a separate data directory.
- **One worker action:** `verify_asset` reads one registered regular file, streams a SHA-256 checksum and byte count, then records the result. It never writes to source files.
- **No arbitrary execution:** no shell/task payloads, plugins, model calls, remote API calls, upload, publish, checkout, email, CRM, payment, customer data, Phoenix integration, or Signalman path.
- **Human-owned release states:** new records always start `private`. The worker cannot change a state. “Approved” and “Final” are owner-recorded ledger states only; they do not publish, sell, deliver, or authorize an external action. Recording either requires the owner confirmation checkbox.
- **Path and workload bounds:** paths must be relative to the selected asset root; resolved symlinks escaping that root are rejected. The worker handles one file at a time, rejects files changed during hashing, and defaults to a 5 GiB maximum per file.
- **Auditability:** asset registration, owner state changes, queued jobs, and verification results are recorded in SQLite event history.
- **Restart behavior:** a normal stop during hashing returns that job to the queue; an abandoned `processing` job is re-queued after 24 hours and recorded in the audit trail.

Treat this as a single-owner workstation utility. Anyone with access to the local OS account and data directory can use the ledger. Do not put passwords, API keys, payment data, or customer records here.

## Requirements

- Python 3.10 or newer (no third-party packages)
- A local private folder containing DG production source files

## Start

Create a private asset directory outside the web project, place source files there, then initialize the ledger:

```bash
mkdir -p "$HOME/DG-Production-Assets"
python3 ops/dg-production-ledger/dg_production.py init
```

Start the owner view in one terminal:

```bash
python3 ops/dg-production-ledger/dg_production.py serve \
  --assets-dir "$HOME/DG-Production-Assets"
```

Open <http://127.0.0.1:8765/> on the same computer. Register source files with paths relative to the selected asset folder, e.g. `book-01/manuscript.docx`. New records are always private. Mark inclusion and rights/source status explicitly; unknown stays unknown.

Start the constrained worker in a second terminal:

```bash
python3 ops/dg-production-ledger/dg_production.py worker \
  --assets-dir "$HOME/DG-Production-Assets"
```

Use **Queue file verification** in the owner view. The worker polls every three seconds and processes queued jobs one at a time. For a one-shot run instead:

```bash
python3 ops/dg-production-ledger/dg_production.py worker \
  --assets-dir "$HOME/DG-Production-Assets" --once
```

Change the database location consistently for `init`, `serve`, and `worker` with `--data-dir /path/to/private/ledger-data`, or set `DG_LEDGER_DATA_DIR`. To lower the size limit, pass `--max-file-bytes N` to `worker`.

Stop each process with `Ctrl-C`. The owner view and worker are independent: queued tasks remain in the ledger until the worker is started again.

## Recorded states

| State | Meaning in this local ledger |
|---|---|
| `private` | Private source or unreviewed work; default state |
| `candidate` | Owner is considering this version for an included product |
| `approved` | Owner recorded an approval decision for this asset/version |
| `blocked` | Do not proceed until the owner resolves a stated concern |
| `final` | Owner records this as the final local production asset/version |

This tool does not contain a public-release workflow. For every included product asset, rights, accessibility, editorial review, product scope, and external release decisions remain separate human-controlled checks.

## Test

From the repository root:

```bash
cd ops/dg-production-ledger
python3 -m unittest discover -s tests -v
```

The tests use temporary directories and fictional data; they do not access external services or alter real production files.
