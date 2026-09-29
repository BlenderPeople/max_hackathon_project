from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.schemas.domain import OrderCreate, ScheduleInput
from app.domain.models import Approval, Business, NotificationOutbox, Order, OrderEvent, OrderStage, Service, User, utcnow


ZERO = Decimal("0.00")


def utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def money(value: Decimal | None) -> str | None:
    return f"{value:.2f}" if value is not None else None


def person_name(user: User) -> str:
    return " ".join(part for part in (user.first_name, user.last_name) if part)


def business_for(db: Session, user: User) -> Business:
    business = db.scalar(select(Business).where(Business.owner_id == user.id))
    if business is None:
        raise HTTPException(status_code=404, detail="business not found")
    return business


def service_view(service: Service) -> dict:
    business = service.business
    return {
        "public_token": service.public_token,
        "title": service.title,
        "description": service.description,
        "price_from": money(service.price_from),
        "image_url": service.image_url,
        "business_name": business.name,
        "duration": f"{service.duration_minutes} минут",
        "duration_minutes": service.duration_minutes,
    }


def business_view(db: Session, business: Business, *, include_services: bool = True,
                  include_bookings: bool = True) -> dict:
    completed = db.scalar(select(func.count(Order.id)).where(Order.business_id == business.id, Order.status == "done")) or 0
    result = {
        "public_token": business.public_token,
        "name": business.name,
        "description": business.description,
        "specialization": business.specialization,
        "experience": business.experience,
        "work_features": business.work_features,
        "owner_name": person_name(business.owner),
        "avatar_url": business.avatar_url,
        "rating": 0,
        "completed_orders": completed,
        "response_time": "—",
    }
    if include_services:
        result["services"] = [service_view(service) for service in business.services if service.is_active]
        schedule = schedule_view(db, business)
        if not include_bookings:
            schedule.pop("bookings")
        result["schedule"] = schedule
    return result


def service_details(db: Session, service: Service) -> dict:
    return {**service_view(service), "business": business_view(db, service.business, include_services=False)}


def paid_amount(order: Order) -> Decimal:
    return sum((payment.amount for payment in order.payments), ZERO)


def latest_approval(order: Order) -> Approval | None:
    return max(order.approvals, key=lambda approval: approval.id, default=None)


def is_overdue(order: Order) -> bool:
    return order.status != "done" and order.due_at is not None and utc(order.due_at) < utcnow()


def actions_for(order: Order, user: User) -> list[str]:
    actions = []
    owner = order.business.owner_id == user.id
    approval = latest_approval(order)
    if owner:
        if order.status in ("new", "in_progress"):
            actions.append("update")
        if order.status == "new" and order.price is not None:
            actions.append("request_approval")
        if order.status == "approval" and approval and approval.status == "rejected":
            actions.append("request_approval")
        if order.status == "in_progress":
            if any(stage.completed_at is None for stage in order.stages):
                actions.append("activate_stage")
            else:
                actions.append("complete")
        if order.status in ("in_progress", "done") and order.price is not None and paid_amount(order) < order.price:
            actions.append("record_payment")
    if order.customer_id == user.id and approval and approval.status == "pending":
        actions.append("decide_approval")
    return actions


def order_view(order: Order, user: User) -> dict:
    approval = latest_approval(order)
    actions = actions_for(order, user)
    return {
        "public_token": order.public_token,
        "title": order.title,
        "description": order.description,
        "status": order.status,
        "role": "master" if order.business.owner_id == user.id else "customer",
        "price": money(order.price),
        "due_at": utc(order.due_at) if order.due_at else None,
        "stages": [{"id": stage.public_token, "position": stage.position, "title": stage.title,
                    "completed_at": utc(stage.completed_at) if stage.completed_at else None} for stage in order.stages],
        "available_actions": actions,
        "timeline": [{"id": event.public_token, "type": event.type, "title": event.title,
                      "created_at": utc(event.created_at)} for event in reversed(order.events)],
        "business_name": order.business.name,
        "customer_name": person_name(order.customer),
        "created_at": utc(order.created_at),
        "amount_paid": money(paid_amount(order)),
        "files": [{"id": file.public_token, "filename": file.filename, "content_type": file.content_type,
                   "size": file.size, "created_at": utc(file.created_at)} for file in order.files],
        "pending_approval": ({"id": approval.public_token, "title": approval.title,
                              "description": approval.description, "amount": money(approval.amount),
                              "status": approval.status} if approval else None),
        "scheduled_start_at": utc(order.scheduled_start_at) if order.scheduled_start_at else None,
        "scheduled_end_at": utc(order.scheduled_end_at) if order.scheduled_end_at else None,
        "requires_attention": is_overdue(order) or "decide_approval" in actions
        or (order.business.owner_id == user.id and order.status == "new"),
        "is_overdue": is_overdue(order),
    }


def visible_order(db: Session, token: str, user: User, *, lock: bool = False) -> Order:
    query = select(Order).where(Order.public_token == token)
    order = db.scalar(query.with_for_update() if lock else query)
    if order is None:
        raise HTTPException(status_code=404, detail="order not found")
    if user.id not in (order.customer_id, order.business.owner_id):
        raise HTTPException(status_code=403, detail="order access denied")
    return order


def require_owner(order: Order, user: User) -> None:
    if order.business.owner_id != user.id:
        raise HTTPException(status_code=403, detail="business owner required")


def add_event(order: Order, user: User, event_type: str, title: str, payload: dict | None = None) -> None:
    event = OrderEvent(actor_id=user.id, type=event_type, title=title, payload=payload or {}, created_at=utcnow())
    order.events.append(event)
    recipient = {
        "order.created": order.customer if order.business.owner_id == user.id else order.business.owner,
        "approval.requested": order.customer,
        "approval.decided": order.business.owner,
        "order.stage_completed": order.customer,
        "order.completed": order.customer,
        "payment.recorded": order.customer,
    }.get(event_type)
    if recipient is not None and recipient.id != user.id:
        event.notifications.append(NotificationOutbox(order=order, recipient=recipient, status="pending",
                                                      attempts=0, next_attempt_at=utcnow(), created_at=utcnow()))


def validate_schedule(data: ScheduleInput) -> None:
    try:
        ZoneInfo(data.timezone)
    except ZoneInfoNotFoundError:
        raise HTTPException(status_code=422, detail="unknown timezone") from None
    if len(data.weekly) != 7 or {day.weekday for day in data.weekly} != set(range(1, 8)):
        raise HTTPException(status_code=422, detail="weekly schedule must have seven distinct days")
    if len({override.date for override in data.overrides}) != len(data.overrides):
        raise HTTPException(status_code=422, detail="duplicate override date")
    for day in [*data.weekly, *data.overrides]:
        ranges = []
        for interval in day.intervals:
            try:
                start = time.fromisoformat(interval.start)
                end = time.fromisoformat(interval.end)
            except ValueError:
                raise HTTPException(status_code=422, detail="invalid interval time") from None
            if start >= end:
                raise HTTPException(status_code=422, detail="interval end must follow start")
            ranges.append((start, end))
        ranges.sort()
        if any(previous[1] > current[0] for previous, current in zip(ranges, ranges[1:])):
            raise HTTPException(status_code=422, detail="overlapping schedule intervals")


def schedule_view(db: Session, business: Business) -> dict:
    bookings = db.scalars(select(Order).where(Order.business_id == business.id, Order.scheduled_start_at.is_not(None), Order.status != "done").order_by(Order.scheduled_start_at)).all()
    return {
        "timezone": business.timezone,
        "slot_duration_minutes": business.slot_duration_minutes,
        "weekly": business.weekly,
        "overrides": business.overrides,
        "bookings": [{"order_public_token": order.public_token, "service_title": order.service.title,
                      "customer_name": person_name(order.customer), "start_at": utc(order.scheduled_start_at),
                      "end_at": utc(order.scheduled_end_at)} for order in bookings],
    }


def slots_for(db: Session, service: Service, on_date: date) -> list[dict]:
    business = service.business
    zone = ZoneInfo(business.timezone)
    override = next((item for item in business.overrides if item["date"] == on_date.isoformat()), None)
    if override:
        intervals = [] if override["mode"] == "closed" else override["intervals"]
    else:
        day = next((item for item in business.weekly if item["weekday"] == on_date.isoweekday()), None)
        intervals = day["intervals"] if day and day["enabled"] else []
    bookings = db.scalars(select(Order).where(
        Order.business_id == business.id,
        Order.scheduled_start_at.is_not(None),
        Order.status != "done",
    )).all()
    result = []
    for interval in intervals:
        start = datetime.combine(on_date, time.fromisoformat(interval["start"]), zone)
        end = datetime.combine(on_date, time.fromisoformat(interval["end"]), zone)
        while start + timedelta(minutes=service.duration_minutes) <= end:
            finish = start + timedelta(minutes=service.duration_minutes)
            if start.astimezone(timezone.utc) > utcnow() and not any(
                booking.scheduled_end_at is not None and utc(start) < utc(booking.scheduled_end_at)
                and utc(finish) > utc(booking.scheduled_start_at) for booking in bookings
            ):
                result.append({"start_at": start, "end_at": finish})
            start += timedelta(minutes=business.slot_duration_minutes)
    return result


def create_order(db: Session, user: User, service: Service, body: OrderCreate) -> Order:
    if service.business.owner_id == user.id:
        if not body.customer_public_token:
            raise HTTPException(status_code=422, detail="customer_public_token is required for master-created orders")
        customer = db.scalar(select(User).where(User.public_token == body.customer_public_token))
        if customer is None or customer.id == user.id:
            raise HTTPException(status_code=404, detail="customer not found")
    else:
        if body.customer_public_token is not None:
            raise HTTPException(status_code=403, detail="only the master can choose a customer")
        customer = user
    if not service.is_active:
        raise HTTPException(status_code=404, detail="service not found")
    if body.scheduled_start_at.tzinfo is None or body.scheduled_end_at.tzinfo is None:
        raise HTTPException(status_code=422, detail="scheduled times require timezone")
    if utc(body.scheduled_end_at) - utc(body.scheduled_start_at) != timedelta(minutes=service.duration_minutes):
        raise HTTPException(status_code=422, detail="slot duration does not match service")
    db.scalar(select(Business).where(Business.id == service.business_id).with_for_update())
    local_date = body.scheduled_start_at.astimezone(ZoneInfo(service.business.timezone)).date()
    if not any(utc(slot["start_at"]) == utc(body.scheduled_start_at) and utc(slot["end_at"]) == utc(body.scheduled_end_at)
               for slot in slots_for(db, service, local_date)):
        raise HTTPException(status_code=409, detail="slot is no longer available")
    now = utcnow()
    order = Order(business=service.business, service=service, customer=customer, title=service.title,
                  description=body.description, status="new", price=None, due_at=body.due_at,
                  scheduled_start_at=utc(body.scheduled_start_at), scheduled_end_at=utc(body.scheduled_end_at),
                  created_at=now, updated_at=now)
    order.stages = [OrderStage(position=index, title=title) for index, title in enumerate(
        ("Осмотр и оценка", "Выполнение работ", "Приёмка"), start=1)]
    add_event(order, user, "order.created", "Заказ создан", {"service_token": service.public_token})
    db.add(order)
    db.commit()
    return order
