#!/usr/bin/env bash
# ============================================================
#  AI Dev Studio - one-click local setup + run (macOS / Linux)
# ============================================================
set -e
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "[ERROR] Node.js is not installed. Install Node 20+ from https://nodejs.org"
  exit 1
fi

echo "=== Node version ==="
node -v

echo "=== Installing packages ==="
npm install

echo "=== Starting AI Dev Studio on http://localhost:8080 ==="
npm run dev -- --port 8080 --host
