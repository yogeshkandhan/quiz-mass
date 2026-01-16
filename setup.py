#!/usr/bin/env python
"""
QuizMaster Backend Setup Script
Run this to initialize and start the backend
"""

import os
import sys
import subprocess

def main():
    print("=" * 50)
    print("QuizMaster Backend Setup")
    print("=" * 50)
    
    # Check Python version
    if sys.version_info < (3, 7):
        print("❌ Python 3.7+ required")
        sys.exit(1)
    
    print("✓ Python version OK")
    
    # Check if requirements.txt exists
    if not os.path.exists('requirements.txt'):
        print("❌ requirements.txt not found")
        sys.exit(1)
    
    # Install dependencies
    print("\n📦 Installing dependencies...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✓ Dependencies installed")
    except subprocess.CalledProcessError:
        print("❌ Failed to install dependencies")
        sys.exit(1)
    
    # Start the app
    print("\n🚀 Starting QuizMaster Backend...")
    print("📍 Server running at: http://127.0.0.1:5000")
    print("📍 API endpoint: http://127.0.0.1:5000/api")
    print("\n⏹️  Press Ctrl+C to stop the server\n")
    
    try:
        exec(open('app.py').read())
    except KeyboardInterrupt:
        print("\n\n✓ Server stopped")

if __name__ == '__main__':
    main()
