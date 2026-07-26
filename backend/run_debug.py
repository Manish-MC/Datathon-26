import os
import sys
import traceback
from http.server import HTTPServer, BaseHTTPRequestHandler

error_message = "No error recorded"

try:
    # Try to import our app
    from app.main import app
    import uvicorn
    
    # Port parsing from sys.argv
    port_str = os.environ.get("X_ZOHO_CATALYST_LISTEN_PORT", "8000")
    if len(sys.argv) > 1:
        port_str = sys.argv[1]
    
    port_str = port_str.replace("$", "").replace("{", "").replace("}", "")
    try:
        port = int(port_str)
    except ValueError:
        port = 8000 # Fallback
    
    print(f"Starting uvicorn on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
    
except Exception as e:
    error_message = traceback.format_exc()
    print("Caught exception during startup:", error_message)
    
    class DebugHandler(BaseHTTPRequestHandler):
        def do_GET(self):
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(error_message.encode('utf-8'))
            
    # Port parsing from sys.argv
    port_str = os.environ.get("X_ZOHO_CATALYST_LISTEN_PORT", "8000")
    if len(sys.argv) > 1:
        port_str = sys.argv[1]
    
    # Strip any curly braces or $ if Catalyst failed to replace them
    port_str = port_str.replace("$", "").replace("{", "").replace("}", "")
    # Wait, if Catalyst failed to replace them, int() will fail!
    # Let's handle it gracefully:
    try:
        port = int(port_str)
    except ValueError:
        port = 8000 # Fallback

    print(f"Starting debug server on port {port}")
    server = HTTPServer(('0.0.0.0', port), DebugHandler)
    server.serve_forever()
