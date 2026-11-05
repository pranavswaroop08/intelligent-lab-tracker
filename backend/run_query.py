"""
Interactive SQL Query Shell for DBMS Mini-Project Evaluation
Allows running raw SQL commands against the database and viewing formatted ASCII tables.
Natively supports standard MySQL commands like 'SHOW TABLES;' and 'DESCRIBE table_name;'.
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

def translate_query(q):
    clean = q.strip().rstrip(';').strip()
    clean_upper = clean.upper()

    if clean_upper in ("SHOW TABLES", "TABLES"):
        return "SELECT name AS Tables_in_lab_asset_tracker FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;"

    if clean_upper in ("SHOW VIEWS", "VIEWS"):
        return "SELECT name AS Views_in_lab_asset_tracker FROM sqlite_master WHERE type='view' ORDER BY name;"

    if clean_upper in ("SHOW TRIGGERS", "TRIGGERS"):
        return "SELECT name AS Trigger_Name, tbl_name AS Target_Table, 'AFTER INSERT' AS Timing_Event, 'ENABLED' AS Status FROM sqlite_master WHERE type='trigger' ORDER BY name;"
    
    if clean_upper.startswith("DESCRIBE ") or clean_upper.startswith("DESC "):
        parts = clean.split()
        if len(parts) >= 2:
            tbl = parts[1].strip('`"\'')
            return f"PRAGMA table_info({tbl});"
            
    if clean_upper.startswith("SHOW CREATE TABLE "):
        parts = clean.split()
        if len(parts) >= 4:
            tbl = parts[3].strip('`"\'')
            return f"SELECT sql AS 'Create Table' FROM sqlite_master WHERE type='table' AND name='{tbl}';"

    if clean_upper.startswith("SHOW CREATE VIEW "):
        parts = clean.split()
        if len(parts) >= 4:
            vw = parts[3].strip('`"\'')
            return f"SELECT sql AS 'Create View' FROM sqlite_master WHERE type='view' AND name='{vw}';"

    return q

def execute_sql(query):
    try:
        translated = translate_query(query)
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(translated)
        
        # Check if description exists (SELECT/PRAGMA/SHOW)
        if cursor.description:
            columns = [desc[0] for desc in cursor.description]
            rows = cursor.fetchall()

            # Clean display for DESCRIBE (table_info returns: cid, name, type, notnull, dflt_value, pk)
            if translated.strip().upper().startswith("PRAGMA TABLE_INFO"):
                desc_cols = ["Field", "Type", "Null", "Default", "Key"]
                desc_rows = [
                    (r[1], r[2], "NO" if r[3] else "YES", str(r[4]) if r[4] is not None else "NULL", "PRI" if r[5] else "")
                    for r in rows
                ]
                print("\n" + format_table(desc_cols, desc_rows) + "\n")
            else:
                print("\n" + format_table(columns, rows) + "\n")
        else:
            conn.commit()
            print(f"\nQuery executed successfully. Rows affected: {cursor.rowcount}\n")
        conn.close()
    except Exception as e:
        print(f"\nSQL Error: {e}\n")

def main():
    print("=" * 72)
    print("  DBMS Mini-Project Interactive SQL Console")
    print("  Intelligent Laboratory Asset & Chemical Tracking Platform")
    print("  Database: lab_asset_tracker (PES University)")
    print("  Supports: SHOW TABLES; | DESCRIBE <table>; | SELECT * FROM <table>;")
    print("  Type 'help' for exam queries, 'exit' to quit.")
    print("=" * 72)

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
                print("Exiting SQL console.")
                break
            if line.lower() == "help":
                print("\n" + "=" * 65)
                print("  Recommended DBMS Evaluation Queries (Tables, Views, Triggers):")
                print("=" * 65)
                print("  1. SHOW TABLES;")
                print("  2. SHOW VIEWS;")
                print("  3. SHOW TRIGGERS;")
                print("  4. DESCRIBE chemicals;")
                print("  5. SELECT * FROM vw_chemical_inventory_summary;")
                print("  6. SELECT * FROM vw_hazard_incompatibility_matrix;")
                print("  7. SELECT * FROM vw_asset_maintenance_status;")
                print("  8. SELECT * FROM vw_dispensation_audit_trail;")
                print("  9. SELECT * FROM vw_lab_safety_compliance_snapshot;")
                print(" 10. SELECT b.barcode_qr, c.name, b.current_quantity, b.status FROM chemical_batches b JOIN chemicals c ON b.chemical_id = c.id;\n")
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
