from datetime import datetime, timezone
from decimal import Decimal
from secrets import choice, token_urlsafe
from string import ascii_lowercase, digits

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def new_token() -> str:
    return token_urlsafe(24)


def new_business_handle() -> str:
    """Generate a short public master handle; uniqueness is enforced by DB."""
    alphabet = ascii_lowercase + digits
    return "master-" + "".join(choice(alphabet) for _ in range(8))


def default_weekly() -> list[dict]:
    return [
        {"weekday": day, "enabled": day <= 5, "intervals": [{"id": f"day-{day}", "start": "10:00", "end": "18:00"}] if day <= 5 else []}
        for day in range(1, 8)
    ]


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    public_token: Mapped[str] = mapped_column(String(64), unique=True, default=new_token)
    max_user_id: Mapped[str] = mapped_column(String(64), unique=True)
    # MAX usernames are optional, so this cannot be a required identifier.
    username: Mapped[str | None] = mapped_column(String(255), index=True)
    first_name: Mapped[str] = mapped_column(String(255))
    last_name: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Business(Base):
    __tablename__ = "businesses"
    id: Mapped[int] = mapped_column(primary_key=True)
    public_token: Mapped[str] = mapped_column(String(64), unique=True, default=new_token)
    handle: Mapped[str] = mapped_column(String(32), unique=True, index=True, default=new_business_handle)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    specialization: Mapped[str] = mapped_column(String(255), default="")
    experience: Mapped[str] = mapped_column(String(255), default="")
    work_features: Mapped[str] = mapped_column(Text, default="")
    avatar_url: Mapped[str | None] = mapped_column(Text)
    timezone: Mapped[str] = mapped_column(String(64), default="Asia/Novosibirsk")
    slot_duration_minutes: Mapped[int] = mapped_column(Integer, default=30)
    weekly: Mapped[list] = mapped_column(JSON, default=default_weekly)
    overrides: Mapped[list] = mapped_column(JSON, default=list)
    owner: Mapped[User] = relationship()
    services: Mapped[list["Service"]] = relationship(back_populates="business")


class Service(Base):
    __tablename__ = "services"
    id: Mapped[int] = mapped_column(primary_key=True)
    public_token: Mapped[str] = mapped_column(String(64), unique=True, default=new_token)
    business_id: Mapped[int] = mapped_column(ForeignKey("businesses.id"), index=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    price_from: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    image_url: Mapped[str | None] = mapped_column(Text)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=60)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    business: Mapped[Business] = relationship(back_populates="services")


class Order(Base):
    __tablename__ = "orders"
    id: Mapped[int] = mapped_column(primary_key=True)
    public_token: Mapped[str] = mapped_column(String(64), unique=True, default=new_token)
    business_id: Mapped[int] = mapped_column(ForeignKey("businesses.id"), index=True)
    service_id: Mapped[int] = mapped_column(ForeignKey("services.id"))
    customer_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(32), default="new", index=True)
    price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    due_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    scheduled_start_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    scheduled_end_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    business: Mapped[Business] = relationship()
    service: Mapped[Service] = relationship()
    customer: Mapped[User] = relationship()
    stages: Mapped[list["OrderStage"]] = relationship(order_by="OrderStage.position", back_populates="order")
    approvals: Mapped[list["Approval"]] = relationship(order_by="Approval.id", back_populates="order")
    payments: Mapped[list["Payment"]] = relationship(order_by="Payment.id", back_populates="order")
    files: Mapped[list["OrderFile"]] = relationship(order_by="OrderFile.id", back_populates="order")
    events: Mapped[list["OrderEvent"]] = relationship(order_by="OrderEvent.id", back_populates="order")


class OrderStage(Base):
    __tablename__ = "order_stages"
    __table_args__ = (UniqueConstraint("order_id", "position"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    public_token: Mapped[str] = mapped_column(String(64), unique=True, default=new_token)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), index=True)
    position: Mapped[int] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(String(255))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    order: Mapped[Order] = relationship(back_populates="stages")


class Approval(Base):
    __tablename__ = "approvals"
    id: Mapped[int] = mapped_column(primary_key=True)
    public_token: Mapped[str] = mapped_column(String(64), unique=True, default=new_token)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), index=True)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    status: Mapped[str] = mapped_column(String(32), default="pending")
    decided_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    order: Mapped[Order] = relationship(back_populates="approvals")


class Payment(Base):
    __tablename__ = "payments"
    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    comment: Mapped[str] = mapped_column(Text, default="")
    recorded_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    paid_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    order: Mapped[Order] = relationship(back_populates="payments")


class OrderFile(Base):
    __tablename__ = "order_files"
    id: Mapped[int] = mapped_column(primary_key=True)
    public_token: Mapped[str] = mapped_column(String(64), unique=True, default=new_token)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), index=True)
    storage_key: Mapped[str] = mapped_column(String(512), unique=True)
    filename: Mapped[str] = mapped_column(String(255))
    content_type: Mapped[str] = mapped_column(String(255))
    size: Mapped[int] = mapped_column(Integer)
    uploaded_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    order: Mapped[Order] = relationship(back_populates="files")


class OrderEvent(Base):
    __tablename__ = "order_events"
    id: Mapped[int] = mapped_column(primary_key=True)
    public_token: Mapped[str] = mapped_column(String(64), unique=True, default=new_token)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), index=True)
    actor_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    type: Mapped[str] = mapped_column(String(64))
    title: Mapped[str] = mapped_column(String(255))
    payload: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    order: Mapped[Order] = relationship(back_populates="events")
    notifications: Mapped[list["NotificationOutbox"]] = relationship(back_populates="event")


class SessionToken(Base):
    __tablename__ = "sessions"
    id: Mapped[int] = mapped_column(primary_key=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    user: Mapped[User] = relationship()


class NotificationOutbox(Base):
    __tablename__ = "notification_outbox"
    __table_args__ = (UniqueConstraint("event_id", "recipient_user_id"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("order_events.id"), index=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), index=True)
    recipient_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    status: Mapped[str] = mapped_column(String(16), default="pending", index=True)
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    next_attempt_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    lease_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_error: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    event: Mapped[OrderEvent] = relationship(back_populates="notifications")
    order: Mapped[Order] = relationship()
    recipient: Mapped[User] = relationship()


class WebhookReceipt(Base):
    __tablename__ = "webhook_receipts"
    id: Mapped[int] = mapped_column(primary_key=True)
    payload_hash: Mapped[str] = mapped_column(String(64), unique=True)
    update_type: Mapped[str] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
