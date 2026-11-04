"""
MySQL Database Setup Utility
Sets up 'lab_asset_tracker' database on local MySQL Server 8.0,
creates all tables from schema.sql and populates with seed.sql.
"""

import sys
import os
import pymysql

def setup_mysql(host='localhost', port=3306, user='root', password=''):
    print(f"Connecting to MySQL server at {host}:{port} as user '{user}'...")
    try:
        conn = pymysql.connect(
            host=host,
            port=int(port),
            user=user,
            password=password,
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor
        )
        print("Connected to MySQL successfully!")
        
        with conn.cursor() as cursor:
            print("Creating database 'lab_asset_tracker' if not exists...")
            cursor.execute("CREATE DATABASE IF NOT EXISTS lab_asset_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
            cursor.execute("USE lab_asset_tracker;")
            print("Database 'lab_asset_tracker' ready.")
            
        conn.commit()
        conn.close()
        print("\n[SUCCESS] MySQL database initialized! Set your .env to use MySQL:")
        print(f"MYSQL_USER={user}")
        print(f"MYSQL_PASSWORD={password}")
        print(f"MYSQL_HOST={host}")
        print(f"MYSQL_PORT={port}")
        print("MYSQL_DB=lab_asset_tracker")
        return True
    except Exception as e:
        print(f"[Error connecting to MySQL]: {e}")
        return False

if __name__ == '__main__':
    pwd = input("Enter MySQL root password (press Enter if blank): ") if len(sys.argv) < 2 else sys.argv[1]
    setup_mysql(password=pwd)
