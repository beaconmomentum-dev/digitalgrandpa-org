#!/usr/bin/env python3
"""Prepare the Digital Grandpa static build for GitHub Pages."""
from __future__ import annotations

import json
import os
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
DIST = PUBLIC / "dist"
DRAFTS = PUBLIC / "drafts"

repository = os.environ.get("GITHUB_REPOSITORY", "beaconmomentum-dev/digitalgrandpa-org")
repository_name = repository.rsplit("/", 1)[-1].strip()
if not repository_name or "/" in repository_name:
    raise SystemExit(f"Invalid GITHUB_REPOSITORY value: {repository!r}")

# GitHub project sites need /<repo>/, while a custom-domain site is served at /.
# A workflow may explicitly select either path; absent an override, retain the
# repository-site default for non-production previews.
BASE = os.environ.get("PAGES_BASE_PATH", f"/{repository_name}/")
if (
    not BASE.startswith("/")
    or not BASE.endswith("/")
    or BASE.startswith("//")
    or ".." in BASE.split("/")
    or "\\" in BASE
):
    raise SystemExit(f"PAGES_BASE_PATH must be '/' or a safe absolute path ending in '/': {BASE!r}")
BASE_PREFIX = BASE.rstrip("/")

if not (DIST / "index.html").is_file():
    raise SystemExit(f"Build output is missing: {DIST / 'index.html'}")

html_attribute = re.compile(
    r"(?P<prefix>\b(?:href|src|action|poster|data|srcset)\s*=\s*)"
    r"(?P<quote>[\"'])(?P<url>/[^\"']*)(?P=quote)",
    re.IGNORECASE,
)
css_url = re.compile(
    r"url\(\s*(?P<quote>[\"']?)(?P<url>/(?!/)[^\"')]+)(?P=quote)\s*\)",
    re.IGNORECASE,
)


def prefix_local_url(value: str) -> str:
    if not value.startswith("/") or value.startswith("//"):
        return value
    if BASE == "/":
        return value
    if value == BASE_PREFIX or value.startswith(BASE):
        return value
    return BASE_PREFIX + value


def prefix_manifest(value: object, key: str = "") -> object:
    if isinstance(value, dict):
        return {k: prefix_manifest(v, k) for k, v in value.items()}
    if isinstance(value, list):
        return [prefix_manifest(item, key) for item in value]
    if isinstance(value, str) and key in {"start_url", "scope", "src", "url"}:
        return prefix_local_url(value)
    return value


for path in DIST.rglob("*"):
    if not path.is_file():
        continue
    suffix = path.suffix.lower()
    if suffix in {".html", ".htm"}:
        text = path.read_text(encoding="utf-8")
        text = html_attribute.sub(
            lambda m: m.group("prefix")
            + m.group("quote")
            + prefix_local_url(m.group("url"))
            + m.group("quote"),
            text,
        )
        path.write_text(text, encoding="utf-8")
    elif suffix == ".css":
        text = path.read_text(encoding="utf-8")
        text = css_url.sub(
            lambda m: "url(" + m.group("quote") + prefix_local_url(m.group("url"))
            + m.group("quote") + ")",
            text,
        )
        path.write_text(text, encoding="utf-8")
    elif suffix == ".json":
        try:
            value = json.loads(path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            continue
        path.write_text(json.dumps(prefix_manifest(value), indent=2) + "\n", encoding="utf-8")

# The preview HTML is also designed to work as a standalone file. Preserve its local
# stylesheet references in the Pages artifact in addition to the embedded CSS fallback.
shared_css = PUBLIC / "dg-foundation.css"
if not shared_css.is_file():
    raise SystemExit(f"Shared Digital Grandpa stylesheet is missing: {shared_css}")
shutil.copy2(shared_css, DIST / "dg-foundation.css")

# Draft previews are intentionally omitted from Vite's normal build inputs. Include
# only the three requested HTML previews and their local CSS/script in the Pages artifact.
allowed = {
    "index.html",
    "when-the-world-changes-fast.html",
    "ai-without-fear.html",
    "draft-pages.css",
    "draft-page.js",
}
output_drafts = DIST / "drafts"
output_drafts.mkdir(parents=True, exist_ok=True)
for name in sorted(allowed):
    source = DRAFTS / name
    if not source.is_file():
        raise SystemExit(f"Required draft preview file is missing: {source}")
    shutil.copy2(source, output_drafts / name)

# Preserve static assets exactly on GitHub Pages without Jekyll processing.
(DIST / ".nojekyll").write_text("", encoding="utf-8")
if BASE == "/":
    print(f"Prepared {DIST} for domain-root serving (PAGES_BASE_PATH=/).")
else:
    print(f"Prepared {DIST} for https://{repository.split('/')[0]}.github.io{BASE}")
print("Copied 3 preview pages, their 2 local assets, and the shared stylesheet.")
