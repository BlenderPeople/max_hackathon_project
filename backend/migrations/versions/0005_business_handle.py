"""Add a stable unique public handle for every master profile.

Revision ID: 0005_business_handle
Revises: 0004_user_username
"""

from alembic import op
import sqlalchemy as sa


revision = "0005_business_handle"
down_revision = "0004_user_username"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("businesses", sa.Column("handle", sa.String(32), nullable=True))
    connection = op.get_bind()
    rows = connection.execute(sa.text("SELECT id FROM businesses ORDER BY id")).fetchall()
    for row in rows:
        # The numeric suffix is stable and unique for already existing rows.
        connection.execute(
            sa.text("UPDATE businesses SET handle = :handle WHERE id = :id"),
            {"handle": f"master-{row.id:04d}", "id": row.id},
        )
    op.alter_column("businesses", "handle", existing_type=sa.String(32), nullable=False)
    op.create_index("ix_businesses_handle", "businesses", ["handle"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_businesses_handle", table_name="businesses")
    op.drop_column("businesses", "handle")
