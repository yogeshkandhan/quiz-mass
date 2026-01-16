"""
Simple HTTP Server to serve the Quiz Website
Run this in the quiz-websites directory
"""

import os
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler
import webbrowser
from threading import Timer

class MyHTTPRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

def start_server():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    server = HTTPServer(('127.0.0.1', 8000), MyHTTPRequestHandler)
    print("=" * 60)
    print("QuizMaster Website Server")
    print("=" * 60)
    print(f"✓ Website running on: http://127.0.0.1:8000")
    print(f"✓ Backend running on: http://127.0.0.1:5000")
    print(f"✓ Opening website in browser...")
    print("=" * 60)
    print("Press CTRL+C to stop the server")
    print("=" * 60)
    
    # Open browser after a short delay
    def open_browser():
        webbrowser.open('http://127.0.0.1:8000')
    
    timer = Timer(1, open_browser)
    timer.daemon = True
    timer.start()
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
        sys.exit(0)

if __name__ == '__main__':
    start_server()
