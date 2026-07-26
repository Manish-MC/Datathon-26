from fastapi import FastAPI
import os

app = FastAPI(title="AI-Powered Police Analytics Platform API (DEBUG)", version="1.0.0")

@app.get("/")
def read_root():
    return {"message": "Debug app is running"}

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "message": "Minimal debug health check",
        "port_var": os.environ.get("X_ZOHO_CATALYST_LISTEN_PORT", "NOT_SET")
    }
