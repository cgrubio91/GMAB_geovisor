"""add user columns

Revision ID: 0001_add_user_columns
Revises: 
Create Date: 2026-01-14 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0001_add_user_columns'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Add columns only if they do not exist
    op.execute("""
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user' AND column_name='password_hash') THEN
            ALTER TABLE "user" ADD COLUMN password_hash TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user' AND column_name='role') THEN
            ALTER TABLE "user" ADD COLUMN role VARCHAR(50) DEFAULT 'user';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user' AND column_name='reset_code') THEN
            ALTER TABLE "user" ADD COLUMN reset_code VARCHAR(128);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user' AND column_name='reset_code_expires') THEN
            ALTER TABLE "user" ADD COLUMN reset_code_expires TIMESTAMP;
        END IF;
    END$$;
    """)


def downgrade():
    op.execute("""
    DO $$
    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user' AND column_name='reset_code_expires') THEN
            ALTER TABLE "user" DROP COLUMN reset_code_expires;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user' AND column_name='reset_code') THEN
            ALTER TABLE "user" DROP COLUMN reset_code;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user' AND column_name='role') THEN
            ALTER TABLE "user" DROP COLUMN role;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user' AND column_name='password_hash') THEN
            ALTER TABLE "user" DROP COLUMN password_hash;
        END IF;
    END$$;
    """)
