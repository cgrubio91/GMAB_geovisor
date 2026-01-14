"""Script seguro para añadir columnas nuevas en la tabla "user" si faltan.
Se conecta usando la misma configuración de `app.db.session`.
"""
from sqlalchemy import text
from app.db.session import engine

columns_to_add = [
    ("password_hash", "TEXT"),
    ("role", "VARCHAR(50) DEFAULT 'user'"),
    ("reset_code", "VARCHAR(128)"),
    ("reset_code_expires", "TIMESTAMP")
]

def column_exists(conn, table_name: str, column_name: str) -> bool:
    sql = text("SELECT 1 FROM information_schema.columns WHERE table_name = :table AND column_name = :column")
    res = conn.execute(sql, {"table": table_name, "column": column_name}).fetchone()
    return bool(res)

def ensure_columns():
    # Use a transaction and commit explicitly
    with engine.begin() as conn:
        for col, col_type in columns_to_add:
            if column_exists(conn, 'user', col):
                print(f"Columna '{col}' ya existe, omitiendo.")
            else:
                print(f"Añadiendo columna '{col}'...")
                alter = text(f'ALTER TABLE "user" ADD COLUMN {col} {col_type};')
                conn.execute(alter)
                print(f"Columna '{col}' añadida.")

    # After commit, list columns to confirm
    with engine.connect() as conn:
        res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'user' ORDER BY ordinal_position"))
        cols = [r[0] for r in res.fetchall()]
        print("Columnas ahora en 'user':", cols)

if __name__ == '__main__':
    try:
        ensure_columns()
        print("Proceso completado.")
    except Exception as e:
        print("Error al aplicar cambios en la BD:", e)
