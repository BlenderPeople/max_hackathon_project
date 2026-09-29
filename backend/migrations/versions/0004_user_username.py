"""Store the optional public username supplied by MAX initData.

Revision ID: 0004_user_username
Revises: 0003_webhook_receipts
"""

from alembic import op
import sqlalchemy as sa


revision = "0004_user_username"
down_revision = "0003_webhook_receipts"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("username", sa.String(255), nullable=True))
    op.create_index("ix_users_username", "users", ["username"])


def downgrade() -> None:
    op.drop_index("ix_users_username", table_name="users")
    op.drop_column("users", "username")
