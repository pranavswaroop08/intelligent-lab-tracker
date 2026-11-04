import os
from pathlib import Path
from dotenv import load_dotenv

# Base Directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Load local .env if present
load_dotenv(BASE_DIR / '.env')

# Also check root or obsidian agent for GEMINI_API_KEY if not in local .env
if not os.getenv('GEMINI_API_KEY'):
    obsidian_env = Path("C:/Users/prana/.gemini/antigravity/scratch/obsidian-agent/.env")
    if obsidian_env.exists():
        load_dotenv(obsidian_env)

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'intelligent-lab-tracking-pes-university-secret-2026')
    DEBUG = os.getenv('DEBUG', 'True').lower() in ('true', '1', 't')
    
    # MySQL configuration
    MYSQL_USER = os.getenv('MYSQL_USER', 'root')
    MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', '')
    MYSQL_HOST = os.getenv('MYSQL_HOST', '127.0.0.1')
    MYSQL_PORT = os.getenv('MYSQL_PORT', '3306')
    MYSQL_DB = os.getenv('MYSQL_DB', 'lab_asset_tracker')
    
    DATABASE_URL = os.getenv('DATABASE_URL')
    
    @classmethod
    def get_sqlalchemy_database_uri(cls):
        """
        Dynamically determine whether to use MySQL or SQLite.
        Attempts to connect to MySQL if configured, otherwise falls back gracefully
        to portable SQLite for instant development/grading demonstrations.
        """
        if cls.DATABASE_URL:
            return cls.DATABASE_URL
        
        # Test MySQL connection
        try:
            import pymysql
            conn = pymysql.connect(
                host=cls.MYSQL_HOST,
                user=cls.MYSQL_USER,
                password=cls.MYSQL_PASSWORD,
                port=int(cls.MYSQL_PORT),
                connect_timeout=2
            )
            conn.close()
            # MySQL connection successful!
            return f"mysql+pymysql://{cls.MYSQL_USER}:{cls.MYSQL_PASSWORD}@{cls.MYSQL_HOST}:{cls.MYSQL_PORT}/{cls.MYSQL_DB}?charset=utf8mb4"
        except Exception:
            # Fallback to local SQLite database
            db_path = BASE_DIR / 'database' / 'lab_tracker.db'
            db_path.parent.mkdir(parents=True, exist_ok=True)
            return f"sqlite:///{db_path}"

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
