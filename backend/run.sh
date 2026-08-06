#!/bin/sh

PORT=${X_ZOHO_CATALYST_LISTEN_PORT:-9000}

echo "======================================"
echo "Starting FastAPI with /tmp workaround"
echo "Original Directory: $(pwd)"
echo "Python Version:"
python3 --version
echo "Port: $PORT"
echo "======================================"

# Workaround for Catalyst AppSail read-only filesystem
# We copy the codebase to /tmp/app which is writable so SQLite can be modified
mkdir -p /tmp/app
cp -r * /tmp/app/
cd /tmp/app

exec python3 -m uvicorn app.main:app \
    --host 0.0.0.0 \
    --port "$PORT"