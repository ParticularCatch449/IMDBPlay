#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v python3 >/dev/null 2>&1; then
  echo "error: python3 is required" >&2
  exit 1
fi

VERSION="$(python3 -c "import json; print(json.load(open('manifest.json'))['version'])")"
OUT="imdbplay-v${VERSION}.zip"

rm -f "$OUT"

python3 - "$OUT" <<'PY'
import json
import sys
import zipfile
from pathlib import Path

root = Path(".")
out = Path(sys.argv[1])
version = json.loads((root / "manifest.json").read_text())["version"]

include = [
    "manifest.json",
    "background.js",
    "content.js",
    "content.css",
    "popup.html",
    "popup.js",
    "popup.css",
    "imdb-adblock.js",
    "imdb-adblock.css",
    "player-guard.js",
    "player-guard-page.js",
    "icons/icon16.png",
    "icons/icon48.png",
    "icons/icon128.png",
    "rules/imdb-ads.json",
    "rules/player-ads.json",
]

missing = [p for p in include if not (root / p).is_file()]
if missing:
    raise SystemExit("missing files:\n  " + "\n  ".join(missing))

with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as zf:
    for rel in include:
        zf.write(root / rel, rel)

print(f"created {out} ({version})")
PY
