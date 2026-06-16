#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "[VoltIQ] Starting backend..."
cd "$SCRIPT_DIR/backend"
"$SCRIPT_DIR/.venv/bin/uvicorn" main:app --port 8000 --reload &
BACKEND_PID=$!

echo "[VoltIQ] Starting frontend..."
cd "$SCRIPT_DIR/frontend"
pnpm dev &
FRONTEND_PID=$!

echo "[VoltIQ] Backend PID: $BACKEND_PID | Frontend PID: $FRONTEND_PID"
echo "[VoltIQ] Backend: http://localhost:8000 | Frontend: http://localhost:3000"
echo "[VoltIQ] Press Ctrl+C to stop both."

trap "echo '[VoltIQ] Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM
wait
