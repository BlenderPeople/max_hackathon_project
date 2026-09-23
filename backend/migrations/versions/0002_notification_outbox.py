"""Add durable order notification outbox.

Revision ID: 0002_notification_outbox
Revises: 0001_domain
"""

from alembic import op
import sqlalchemy as sa

revision = "0002_notification_outbox"
down_revision = "0001_domain"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "notification_outbox",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("event_id", sa.Integer(), sa.ForeignKey("order_events.id"), nullable=False),
        sa.Column("order_id", sa.Integer(), sa.ForeignKey("orders.id"), nullable=False),
        sa.Column("recipient_user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("status", sa.String(16), nullable=False),
        sa.Column("attempts", sa.Integer(), nullable=False),
        sa.Column("next_attempt_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("lease_until", sa.DateTime(timezone=True)),
        sa.Column("sent_at", sa.DateTime(timezone=True)),
        sa.Column("last_error", sa.String(255)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("event_id", "recipient_user_id"),
    )
    op.create_index("ix_notification_outbox_event_id", "notification_outbox", ["event_id"])
    op.create_index("ix_notification_outbox_order_id", "notification_outbox", ["order_id"])
    op.create_index("ix_notification_outbox_recipient_user_id", "notification_outbox", ["recipient_user_id"])
    op.create_index("ix_notification_outbox_status", "notification_outbox", ["status"])


def downgrade() -> None:
    op.drop_table("notification_outbox")
