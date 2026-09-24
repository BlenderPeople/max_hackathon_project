"""Create MVP domain tables.

Revision ID: 0001_domain
Revises:
"""

from alembic import op
import sqlalchemy as sa

revision = "0001_domain"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table("users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("public_token", sa.String(64), unique=True, nullable=False),
        sa.Column("max_user_id", sa.String(64), unique=True, nullable=False),
        sa.Column("first_name", sa.String(255), nullable=False),
        sa.Column("last_name", sa.String(255)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False))
    op.create_table("businesses",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("public_token", sa.String(64), unique=True, nullable=False),
        sa.Column("owner_id", sa.Integer(), sa.ForeignKey("users.id"), unique=True, nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("specialization", sa.String(255), nullable=False),
        sa.Column("experience", sa.String(255), nullable=False),
        sa.Column("work_features", sa.Text(), nullable=False),
        sa.Column("avatar_url", sa.Text()),
        sa.Column("timezone", sa.String(64), nullable=False),
        sa.Column("slot_duration_minutes", sa.Integer(), nullable=False),
        sa.Column("weekly", sa.JSON(), nullable=False),
        sa.Column("overrides", sa.JSON(), nullable=False))
    op.create_table("services",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("public_token", sa.String(64), unique=True, nullable=False),
        sa.Column("business_id", sa.Integer(), sa.ForeignKey("businesses.id"), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("price_from", sa.Numeric(12, 2)),
        sa.Column("image_url", sa.Text()),
        sa.Column("duration_minutes", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False))
    op.create_index("ix_services_business_id", "services", ["business_id"])
    op.create_table("orders",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("public_token", sa.String(64), unique=True, nullable=False),
        sa.Column("business_id", sa.Integer(), sa.ForeignKey("businesses.id"), nullable=False),
        sa.Column("service_id", sa.Integer(), sa.ForeignKey("services.id"), nullable=False),
        sa.Column("customer_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("status", sa.String(32), nullable=False),
        sa.Column("price", sa.Numeric(12, 2)),
        sa.Column("due_at", sa.DateTime(timezone=True)),
        sa.Column("scheduled_start_at", sa.DateTime(timezone=True)),
        sa.Column("scheduled_end_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False))
    op.create_index("ix_orders_business_id", "orders", ["business_id"])
    op.create_index("ix_orders_customer_id", "orders", ["customer_id"])
    op.create_index("ix_orders_status", "orders", ["status"])
    op.create_index("ix_orders_scheduled_start_at", "orders", ["scheduled_start_at"])
    op.create_table("order_stages",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("public_token", sa.String(64), unique=True, nullable=False),
        sa.Column("order_id", sa.Integer(), sa.ForeignKey("orders.id"), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True)),
        sa.UniqueConstraint("order_id", "position"))
    op.create_index("ix_order_stages_order_id", "order_stages", ["order_id"])
    op.create_table("approvals",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("public_token", sa.String(64), unique=True, nullable=False),
        sa.Column("order_id", sa.Integer(), sa.ForeignKey("orders.id"), nullable=False),
        sa.Column("author_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2)),
        sa.Column("status", sa.String(32), nullable=False),
        sa.Column("decided_by_id", sa.Integer(), sa.ForeignKey("users.id")),
        sa.Column("decided_at", sa.DateTime(timezone=True)))
    op.create_index("ix_approvals_order_id", "approvals", ["order_id"])
    op.create_table("payments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("order_id", sa.Integer(), sa.ForeignKey("orders.id"), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("comment", sa.Text(), nullable=False),
        sa.Column("recorded_by_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=False))
    op.create_index("ix_payments_order_id", "payments", ["order_id"])
    op.create_table("order_files",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("public_token", sa.String(64), unique=True, nullable=False),
        sa.Column("order_id", sa.Integer(), sa.ForeignKey("orders.id"), nullable=False),
        sa.Column("storage_key", sa.String(512), unique=True, nullable=False),
        sa.Column("filename", sa.String(255), nullable=False),
        sa.Column("content_type", sa.String(255), nullable=False),
        sa.Column("size", sa.Integer(), nullable=False),
        sa.Column("uploaded_by_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False))
    op.create_index("ix_order_files_order_id", "order_files", ["order_id"])
    op.create_table("order_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("public_token", sa.String(64), unique=True, nullable=False),
        sa.Column("order_id", sa.Integer(), sa.ForeignKey("orders.id"), nullable=False),
        sa.Column("actor_id", sa.Integer(), sa.ForeignKey("users.id")),
        sa.Column("type", sa.String(64), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False))
    op.create_index("ix_order_events_order_id", "order_events", ["order_id"])
    op.create_table("sessions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("token_hash", sa.String(64), unique=True, nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False))
    op.create_index("ix_sessions_user_id", "sessions", ["user_id"])


def downgrade() -> None:
    for table in ("sessions", "order_events", "order_files", "payments", "approvals", "order_stages", "orders", "services", "businesses", "users"):
        op.drop_table(table)
