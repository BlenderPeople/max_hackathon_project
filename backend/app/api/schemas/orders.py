from datetime import datetime
from decimal import Decimal
from enum import StrEnum

from pydantic import BaseModel, Field


class OrderStatus(StrEnum):
    NEW = "new"
    APPROVAL = "approval"
    IN_PROGRESS = "in_progress"
    DONE = "done"


class OrderAction(StrEnum):
    UPDATE = "update"
    ACTIVATE_STAGE = "activate_stage"
    DECIDE_APPROVAL = "decide_approval"
    RECORD_PAYMENT = "record_payment"
    COMPLETE = "complete"


class OrderStageView(BaseModel):
    id: str
    position: int
    title: str
    completed_at: datetime | None = None


class OrderEventView(BaseModel):
    id: str
    type: str
    title: str
    created_at: datetime


class OrderView(BaseModel):
    """Draft response shape for frontend integration; agree before exposing."""

    public_token: str
    title: str
    description: str
    status: OrderStatus
    price: Decimal | None = None
    due_at: datetime | None = None
    stages: list[OrderStageView] = Field(default_factory=list)
    available_actions: list[OrderAction] = Field(default_factory=list)
    timeline: list[OrderEventView] = Field(default_factory=list)
