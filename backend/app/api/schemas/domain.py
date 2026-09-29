from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field


class MaxAuthInput(BaseModel):
    init_data: str = Field(min_length=1)


class UserView(BaseModel):
    id: str
    first_name: str
    last_name: str | None
    max_user_id: str
    username: str | None


class AuthView(BaseModel):
    session_token: str
    expires_at: datetime
    user: UserView


class ServiceInput(BaseModel):
    title: str = Field(min_length=1, max_length=80)
    description: str = Field(max_length=4000)
    price_from: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    duration_minutes: int = Field(ge=15, le=480)
    image_data_url: str | None = Field(default=None, max_length=2_000_000)


class ServiceView(BaseModel):
    public_token: str
    title: str
    description: str
    price_from: str | None
    image_url: str | None
    business_name: str
    duration: str
    duration_minutes: int


class ServiceDetails(ServiceView):
    business: dict


class BusinessInput(BaseModel):
    name: str = Field(max_length=120)
    specialization: str = Field(max_length=120)
    experience: str = Field(max_length=120)
    work_features: str = Field(max_length=300)
    description: str = Field(max_length=300)
    avatar_data_url: str | None = Field(default=None, max_length=2_000_000)


class TimeInterval(BaseModel):
    id: str = Field(min_length=1, max_length=64)
    start: str
    end: str


class WeeklyDay(BaseModel):
    weekday: int = Field(ge=1, le=7)
    enabled: bool
    intervals: list[TimeInterval]


class ScheduleOverride(BaseModel):
    date: date
    mode: Literal["closed", "custom"]
    intervals: list[TimeInterval]


class ScheduleInput(BaseModel):
    timezone: str
    slot_duration_minutes: int = Field(ge=15, le=240)
    weekly: list[WeeklyDay]
    overrides: list[ScheduleOverride]


class ScheduleView(ScheduleInput):
    bookings: list[dict]


class AvailableSlot(BaseModel):
    start_at: datetime
    end_at: datetime


class ConversationCreate(BaseModel):
    service_public_token: str = Field(min_length=1, max_length=64)


class ChatMessageInput(BaseModel):
    text: str = Field(min_length=1, max_length=4000)


class ChatMessageView(BaseModel):
    public_token: str
    author_id: str
    author_name: str
    is_mine: bool
    text: str
    created_at: datetime


class ConversationView(BaseModel):
    public_token: str
    service_public_token: str
    service_title: str
    business_name: str
    customer_name: str
    peer_name: str
    role: Literal["master", "customer"]
    created_at: datetime
    updated_at: datetime
    messages: list[ChatMessageView]


class OrderCreate(BaseModel):
    service_public_token: str
    customer_public_token: str | None = None
    description: str = Field(min_length=0, max_length=4000)
    due_at: datetime | None = None
    scheduled_start_at: datetime
    scheduled_end_at: datetime


class OrderUpdate(BaseModel):
    description: str | None = Field(default=None, min_length=0, max_length=4000)
    due_at: datetime | None = None
    price: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)


class ApprovalRequest(BaseModel):
    title: str = Field(default="Согласование стоимости", max_length=255)
    description: str = Field(default="", max_length=4000)


class ApprovalDecision(BaseModel):
    approved: bool


class PaymentInput(BaseModel):
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    comment: str = Field(default="", max_length=4000)


class OrderStageView(BaseModel):
    id: str
    position: int
    title: str
    completed_at: datetime | None


class OrderEventView(BaseModel):
    id: str
    type: str
    title: str
    created_at: datetime


class ApprovalView(BaseModel):
    id: str
    title: str
    description: str
    amount: str | None
    status: Literal["pending", "approved", "rejected"]


class OrderFileView(BaseModel):
    id: str
    filename: str
    content_type: str
    size: int
    created_at: datetime


class OrderView(BaseModel):
    public_token: str
    service_public_token: str
    title: str
    description: str
    status: Literal["new", "approval", "in_progress", "done"]
    role: Literal["master", "customer"]
    price: str | None
    due_at: datetime | None
    stages: list[OrderStageView]
    available_actions: list[str]
    timeline: list[OrderEventView]
    business_name: str
    business_public_token: str
    business_owner_username: str | None
    customer_name: str
    created_at: datetime
    amount_paid: str
    files: list[OrderFileView]
    pending_approval: ApprovalView | None
    scheduled_start_at: datetime | None
    scheduled_end_at: datetime | None
    requires_attention: bool
    is_overdue: bool
