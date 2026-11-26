#!/bin/sh
# Launcher (macOS/Linux): serves this folder over http and opens it.
# Usage: sh start.sh [port]
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo "[start.sh] node was not found on PATH. Install Node.js, then run: sh start.sh"
  echo "Alternative without Node: python3 -m http.server 8000"
  exit 1
fi
exec node serve.mjs "${1:-8000}"
