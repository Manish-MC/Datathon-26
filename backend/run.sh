#!/bin/sh
export PORT=${X_ZOHO_CATALYST_LISTEN_PORT:-9000}
echo "Starting uvicorn on port $PORT"
python -m uvicorn main:app --host 0.0.0.0 --port $PORT
