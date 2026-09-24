"""Record MAX webhook deliveries for durable replay deduplication.

Revision ID: 0003_webhook_receipts
Revises: 0002_notification_outbox
"""

from alembic import op
import sqlalchemy as sa

revision = "0003_webhook_receipts"
down_revision = "0002_notification_outbox"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "webhook_receipts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("payload_hash", sa.String(64), nullable=False, unique=True),
        sa.Column("update_type", sa.String(64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("webhook_receipts")
