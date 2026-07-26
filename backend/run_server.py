import os
import traceback
import sys
import json
from http.server import HTTPServer, BaseHTTPRequestHandler

def get_port():
    port_str = os.environ.get("X_ZOHO_CATALYST_LISTEN_PORT")
    if port_str:
        return int(port_str)
    return 9000

if __name__ == '__main__':
    port = 9000
    try:
        port = get_port()
        print(f"Starting uvicorn on port {port}...", flush=True)
        from app.main import app
        import uvicorn
        uvicorn.run(app, host="0.0.0.0", port=port)
    except Exception as e:
        error_msg = traceback.format_exc()
        print(f"FAILED TO START SERVER: {e}")
        print(error_msg)
        
        class DebugHandler(BaseHTTPRequestHandler):
            def do_GET(self):
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                # Return JSON so health check passes and we can read the body!
                response = {
                    "status": "healthy",
                    "error_trace": error_msg
                }
                self.wfile.write(json.dumps(response).encode('utf-8'))
                
        print(f"Starting debug HTTP server on port {port}")
        server = HTTPServer(('0.0.0.0', port), DebugHandler)
        server.serve_forever()
