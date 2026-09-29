"""Add private conversations inside the Mini App.

Revision ID: 0006_conversations
Revises: 0005_business_handle
"""

from alembic import op
import sqlalchemy as sa


revision = "0006_conversations"
down_revision = "0005_business_handle"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "conversations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("public_token", sa.String(64), nullable=False, unique=True),
        sa.Column("business_id", sa.Integer(), sa.ForeignKey("businesses.id"), nullable=False),
        sa.Column("service_id", sa.Integer(), sa.ForeignKey("services.id"), nullable=False),
        sa.Column("customer_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("service_id", "customer_id"),
    )
    op.create_index("ix_conversations_business_id", "conversations", ["business_id"])
    op.create_index("ix_conversations_service_id", "conversations", ["service_id"])
    op.create_index("ix_conversations_customer_id", "conversations", ["customer_id"])
    op.create_index("ix_conversations_updated_at", "conversations", ["updated_at"])
    op.create_table(
        "chat_messages",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("public_token", sa.String(64), nullable=False, unique=True),
        sa.Column("conversation_id", sa.Integer(), sa.ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("author_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_chat_messages_conversation_id", "chat_messages", ["conversation_id"])
    op.create_index("ix_chat_messages_author_id", "chat_messages", ["author_id"])


def downgrade() -> None:
    op.drop_table("chat_messages")
    op.drop_table("conversations")
