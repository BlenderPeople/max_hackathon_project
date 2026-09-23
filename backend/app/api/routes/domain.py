from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_db_session
from app.api.schemas.domain import (
    ApprovalDecision, ApprovalRequest, AuthView, AvailableSlot, BusinessInput, MaxAuthInput,
    OrderCreate, OrderEventView, OrderUpdate, OrderView, PaymentInput, ScheduleInput,
    ScheduleView, ServiceDetails, ServiceInput, UserView,
)
from app.domain.models import Approval, Business, Order, OrderStage, Payment, Service, User, utcnow
from app.services.auth import create_session, current_user, validate_init_data
from app.services.domain import (
    ZERO, actions_for, add_event, business_for, business_view, create_order, is_overdue,
    latest_approval, money, order_view, paid_amount, require_owner, schedule_view,
    service_details, service_view, slots_for, validate_schedule, visible_order,
)

router = APIRouter(tags=["domain"])


@router.post("/auth/max", response_model=AuthView)
def auth_max(body: MaxAuthInput, db: Session = Depends(get_db_session)) -> dict:
    user, token, expires_at = create_session(db, validate_init_data(body.init_data))
    return {"session_token": token, "expires_at": expires_at, "user": user_view(user)}


def user_view(user: User) -> dict:
    return {"id": user.public_token, "first_name": user.first_name,
            "last_name": user.last_name, "max_user_id": user.max_user_id}


@router.get("/me", response_model=UserView)
def me(user: User = Depends(current_user)) -> dict:
    return user_view(user)


@router.get("/businesses/me")
def my_business(db: Session = Depends(get_db_session), user: User = Depends(current_user)) -> dict:
    return business_view(db, business_for(db, user))


@router.patch("/businesses/me")
def update_business(body: BusinessInput, db: Session = Depends(get_db_session), user: User = Depends(current_user)) -> dict:
    business = business_for(db, user)
    business.specialization = body.specialization
    business.experience = body.experience
    business.work_features = body.work_features
    business.description = body.description
    business.avatar_url = body.avatar_data_url
    db.commit()
    return business_view(db, business)


@router.get("/businesses/{public_token}")
def get_business(public_token: str, db: Session = Depends(get_db_session)) -> dict:
    business = db.scalar(select(Business).where(Business.public_token == public_token))
    if business is None:
        raise HTTPException(status_code=404, detail="business not found")
    return business_view(db, business)


@router.get("/businesses/{public_token}/services")
def get_business_services(public_token: str, db: Session = Depends(get_db_session)) -> list[dict]:
    business = db.scalar(select(Business).where(Business.public_token == public_token))
    if business is None:
        raise HTTPException(status_code=404, detail="business not found")
    return [service_view(service) for service in business.services if service.is_active]


@router.get("/businesses/me/schedule", response_model=ScheduleView)
def my_schedule(db: Session = Depends(get_db_session), user: User = Depends(current_user)) -> dict:
    return schedule_view(db, business_for(db, user))


@router.put("/businesses/me/schedule", response_model=ScheduleView)
def update_schedule(body: ScheduleInput, db: Session = Depends(get_db_session), user: User = Depends(current_user)) -> dict:
    validate_schedule(body)
    business = db.scalar(select(Business).where(Business.owner_id == user.id).with_for_update())
    if business is None:
        raise HTTPException(status_code=404, detail="business not found")
    business.timezone = body.timezone
    business.slot_duration_minutes = body.slot_duration_minutes
    business.weekly = [day.model_dump() for day in body.weekly]
    business.overrides = [{**item.model_dump(), "date": item.date.isoformat()} for item in body.overrides]
    db.commit()
    return schedule_view(db, business)


@router.get("/services/{public_token}", response_model=ServiceDetails)
def get_service(public_token: str, db: Session = Depends(get_db_session)) -> dict:
    service = db.scalar(select(Service).where(Service.public_token == public_token, Service.is_active.is_(True)))
    if service is None:
        raise HTTPException(status_code=404, detail="service not found")
    return service_details(db, service)


@router.get("/services/{public_token}/availability", response_model=list[AvailableSlot])
def get_availability(public_token: str, date: date, db: Session = Depends(get_db_session)) -> list[dict]:
    service = db.scalar(select(Service).where(Service.public_token == public_token, Service.is_active.is_(True)))
    if service is None:
        raise HTTPException(status_code=404, detail="service not found")
    return slots_for(db, service, date)


@router.post("/services", response_model=ServiceDetails, status_code=201)
def create_service(body: ServiceInput, db: Session = Depends(get_db_session), user: User = Depends(current_user)) -> dict:
    business = business_for(db, user)
    service = Service(business=business, title=body.title, description=body.description,
                      price_from=body.price_from, duration_minutes=body.duration_minutes,
                      image_url=body.image_data_url, is_active=True)
    db.add(service)
    db.commit()
    return service_details(db, service)


@router.patch("/services/{public_token}", response_model=ServiceDetails)
def update_service(public_token: str, body: ServiceInput, db: Session = Depends(get_db_session), user: User = Depends(current_user)) -> dict:
    service = db.scalar(select(Service).where(Service.public_token == public_token))
    if service is None:
        raise HTTPException(status_code=404, detail="service not found")
    if service.business.owner_id != user.id:
        raise HTTPException(status_code=403, detail="business owner required")
    service.title = body.title
    service.description = body.description
    service.price_from = body.price_from
    service.duration_minutes = body.duration_minutes
    service.image_url = body.image_data_url
    db.commit()
    return service_details(db, service)


@router.get("/orders", response_model=list[OrderView])
def list_orders(
    filter: str = Query(default="all", pattern="^(all|attention|active|overdue|completed)$"),
    db: Session = Depends(get_db_session), user: User = Depends(current_user),
) -> list[dict]:
    orders = db.scalars(select(Order).join(Business, Order.business_id == Business.id)
                        .where((Order.customer_id == user.id) | (Business.owner_id == user.id))
                        .order_by(Order.created_at.desc())).all()
    if filter == "attention":
        orders = [order for order in orders if order_view(order, user)["requires_attention"]]
    elif filter == "active":
        orders = [order for order in orders if order.status != "done"]
    elif filter == "overdue":
        orders = [order for order in orders if is_overdue(order)]
    elif filter == "completed":
        orders = [order for order in orders if order.status == "done"]
    return [order_view(order, user) for order in orders]


@router.post("/orders", response_model=OrderView, status_code=201)
def new_order(body: OrderCreate, db: Session = Depends(get_db_session), user: User = Depends(current_user)) -> dict:
    service = db.scalar(select(Service).where(Service.public_token == body.service_public_token))
    if service is None:
        raise HTTPException(status_code=404, detail="service not found")
    return order_view(create_order(db, user, service, body), user)


@router.get("/orders/{public_token}", response_model=OrderView)
def get_order(public_token: str, db: Session = Depends(get_db_session), user: User = Depends(current_user)) -> dict:
    return order_view(visible_order(db, public_token, user), user)


@router.patch("/orders/{public_token}", response_model=OrderView)
def update_order(public_token: str, body: OrderUpdate, db: Session = Depends(get_db_session), user: User = Depends(current_user)) -> dict:
    order = visible_order(db, public_token, user, lock=True)
    require_owner(order, user)
    if order.status == "done":
        raise HTTPException(status_code=409, detail="completed order cannot be edited")
    if order.status == "approval" and latest_approval(order) and latest_approval(order).status == "pending":
        raise HTTPException(status_code=409, detail="pending approval must be decided first")
    changes = body.model_dump(exclude_unset=True)
    if not changes or ("description" in changes and not changes["description"]):
        raise HTTPException(status_code=422, detail="no valid changes")
    if "price" in changes:
        if changes["price"] is None or changes["price"] < paid_amount(order):
            raise HTTPException(status_code=409, detail="price cannot be below paid amount")
        if order.status == "in_progress" and changes["price"] != order.price:
            raise HTTPException(status_code=409, detail="approved price cannot be changed")
    for key, value in changes.items():
        setattr(order, key, value)
    order.updated_at = utcnow()
    add_event(order, user, "order.updated", "Заказ изменён", {key: str(value) for key, value in changes.items()})
    db.commit()
    return order_view(order, user)


@router.post("/orders/{public_token}/approvals", response_model=OrderView)
def request_approval(public_token: str, body: ApprovalRequest, db: Session = Depends(get_db_session), user: User = Depends(current_user)) -> dict:
    order = visible_order(db, public_token, user, lock=True)
    require_owner(order, user)
    previous = latest_approval(order)
    if order.status not in ("new", "approval") or (order.status == "approval" and (previous is None or previous.status != "rejected")):
        raise HTTPException(status_code=409, detail="approval cannot be requested now")
    if order.price is None:
        raise HTTPException(status_code=409, detail="set order price first")
    order.status = "approval"
    order.approvals.append(Approval(author_id=user.id, title=body.title, description=body.description or order.description,
                                    amount=order.price, status="pending"))
    add_event(order, user, "approval.requested", "Стоимость отправлена на согласование")
    db.commit()
    return order_view(order, user)


@router.post("/approvals/{approval_token}/decision", response_model=OrderView)
def decide_approval(approval_token: str, body: ApprovalDecision, db: Session = Depends(get_db_session), user: User = Depends(current_user)) -> dict:
    approval = db.scalar(select(Approval).where(Approval.public_token == approval_token))
    if approval is None:
        raise HTTPException(status_code=404, detail="approval not found")
    order = visible_order(db, approval.order.public_token, user, lock=True)
    if order.customer_id != user.id:
        raise HTTPException(status_code=403, detail="customer required")
    if order.status != "approval" or approval.status != "pending" or latest_approval(order).id != approval.id:
        raise HTTPException(status_code=409, detail="approval is not pending")
    approval.status = "approved" if body.approved else "rejected"
    approval.decided_by_id = user.id
    approval.decided_at = utcnow()
    order.status = "in_progress" if body.approved else "new"
    add_event(order, user, "approval.decided", "Стоимость подтверждена" if body.approved else "Согласование отклонено",
              {"approved": body.approved})
    db.commit()
    return order_view(order, user)


@router.post("/orders/{public_token}/stages/{stage_token}/activate", response_model=OrderView)
def activate_stage(public_token: str, stage_token: str, db: Session = Depends(get_db_session), user: User = Depends(current_user)) -> dict:
    order = visible_order(db, public_token, user, lock=True)
    require_owner(order, user)
    if order.status != "in_progress":
        raise HTTPException(status_code=409, detail="work is not in progress")
    stage = next((stage for stage in order.stages if stage.completed_at is None), None)
    if stage is None or stage.public_token != stage_token:
        raise HTTPException(status_code=409, detail="only current stage can be completed")
    stage.completed_at = utcnow()
    add_event(order, user, "order.stage_completed", f"Этап «{stage.title}» завершён", {"stage_token": stage.public_token})
    db.commit()
    return order_view(order, user)


@router.post("/orders/{public_token}/complete", response_model=OrderView)
def complete_order(public_token: str, db: Session = Depends(get_db_session), user: User = Depends(current_user)) -> dict:
    order = visible_order(db, public_token, user, lock=True)
    require_owner(order, user)
    if order.status != "in_progress" or any(stage.completed_at is None for stage in order.stages):
        raise HTTPException(status_code=409, detail="finish all stages first")
    order.status = "done"
    add_event(order, user, "order.completed", "Заказ завершён")
    db.commit()
    return order_view(order, user)


@router.post("/orders/{public_token}/payments", response_model=OrderView)
def record_payment(public_token: str, body: PaymentInput, db: Session = Depends(get_db_session), user: User = Depends(current_user)) -> dict:
    order = visible_order(db, public_token, user, lock=True)
    require_owner(order, user)
    if order.status not in ("in_progress", "done") or order.price is None:
        raise HTTPException(status_code=409, detail="payment is not available")
    if paid_amount(order) + body.amount > order.price:
        raise HTTPException(status_code=409, detail="payment exceeds remaining amount")
    order.payments.append(Payment(amount=body.amount, comment=body.comment, recorded_by_id=user.id, paid_at=utcnow()))
    add_event(order, user, "payment.recorded", f"Оплата {money(body.amount)} ₽ зафиксирована",
              {"amount": money(body.amount)})
    db.commit()
    return order_view(order, user)


@router.get("/orders/{public_token}/events", response_model=list[OrderEventView])
def events(public_token: str, db: Session = Depends(get_db_session), user: User = Depends(current_user)) -> list[dict]:
    order = visible_order(db, public_token, user)
    return order_view(order, user)["timeline"]
