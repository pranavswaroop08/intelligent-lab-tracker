"""
Interactive SQL Query Shell for DBMS Mini-Project Evaluation
Allows running raw SQL commands against the database and viewing formatted ASCII tables.
"""

import sys
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / 'database' / 'lab_tracker.db'

def format_table(columns, rows):
    if not rows:
        return "(0 rows returned)"
    
    col_widths = [len(str(col)) for col in columns]
    for row in rows:
        for idx, val in enumerate(row):
            str_val = "NULL" if val is None else str(val)
            if len(str_val) > col_widths[idx]:
                col_widths[idx] = min(40, max(col_widths[idx], len(str_val)))

    header = " | ".join(f"{str(col):<{col_widths[i]}}" for i, col in enumerate(columns))
    separator = "-+-".join("-" * col_widths[i] for i in range(len(columns)))
    
    output = [header, separator]
    for row in rows:
        row_str = []
        for i, val in enumerate(row):
            val_str = "NULL" if val is None else str(val)
            if len(val_str) > col_widths[i]:
                val_str = val_str[:col_widths[i]-3] + "..."
            row_str.append(f"{val_str:<{col_widths[i]}}")
        output.append(" | ".join(row_str))
    
    return "\n".join(output) + f"\n({len(rows)} row(s) returned)"

def execute_sql(query):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(query)
        
        if query.strip().upper().startswith(("SELECT", "PRAGMA", "EXPLAIN")):
            columns = [desc[0] for desc in cursor.description] if cursor.description else []
            rows = cursor.fetchall()
            print("\n" + format_table(columns, rows) + "\n")
        else:
            conn.commit()
            print(f"\nQuery executed successfully. Rows affected: {cursor.rowcount}\n")
        conn.close()
    except Exception as e:
        print(f"\nSQL Error: {e}\n")

def main():
    print("=" * 70)
    print("  DBMS Mini-Project Interactive SQL Shell")
    print("  Database: lab_tracker.db (PES University)")
    print("  Type your SQL command followed by ';' or press Enter.")
    print("  Type 'help' for pre-built queries, 'tables' to list tables, or 'exit' to quit.")
    print("=" * 70)

    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:])
        print(f"Executing: {query}")
        execute_sql(query)
        return

    buffer = ""
    while True:
        try:
            prompt = "SQL> " if not buffer else " ...> "
            line = input(prompt).strip()
            
            if not line:
                continue
            if line.lower() in ("exit", "quit", "q"):
                print("Exiting SQL shell.")
                break
            if line.lower() == "tables":
                execute_sql("SELECT name AS table_name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
                continue
            if line.lower() == "help":
                print("\nRecommended Queries for Teacher Evaluation:")
                print("1. SELECT id, cas_number, name, formula, min_threshold_qty FROM chemicals;")
                print("2. SELECT b.barcode_qr, c.name, b.current_quantity, b.expiry_date FROM chemical_batches b JOIN chemicals c ON b.chemical_id = c.id;")
                print("3. SELECT l.name, COUNT(b.id) AS total_containers FROM storage_locations l LEFT JOIN chemical_batches b ON l.id = b.location_id GROUP BY l.id;")
                print("4. SELECT c.name, SUM(d.dispensed_amount) AS total_dispensed FROM dispensations d JOIN chemical_batches b ON d.batch_id = b.id JOIN chemicals c ON b.chemical_id = c.id GROUP BY c.id;\n")
                continue

            buffer += " " + line
            if buffer.strip().endswith(";"):
                execute_sql(buffer.strip())
                buffer = ""
        except KeyboardInterrupt:
            print("\nQuery cancelled.")
            buffer = ""
        except EOFError:
            break

if __name__ == '__main__':
    main()
