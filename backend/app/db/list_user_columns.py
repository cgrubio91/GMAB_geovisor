from app.db.session import engine
from sqlalchemy import text

with engine.connect() as conn:
    res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'user' ORDER BY ordinal_position"))
    cols = [r[0] for r in res.fetchall()]
    print("Columnas en tabla 'user':", cols)
