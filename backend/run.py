"""
Entry point for Flask Backend Server
Intelligent Laboratory Asset & Chemical Tracking Platform
PES University
"""

import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from app import create_app
from database.init_db import init_database

app = create_app()

if __name__ == '__main__':
    print("=" * 70)
    print("  Intelligent Laboratory Asset & Chemical Tracking Platform")
    print("  Authors: Pranav Swaroop S (PES2UG24CS365) & Pranav Kaushal J (PES2UG24CS363)")
    print("  PES University - Electronic City Campus")
    print("=" * 70)
    
    # Auto-initialize database schema and seed records on first launch
    try:
        init_database()
    except Exception as e:
        print(f"[Run Warning] Database auto-init note: {e}")

    print("\n🚀 Starting Flask REST API at http://127.0.0.1:5000 ...")
    app.run(host='127.0.0.1', port=5000, debug=True)
