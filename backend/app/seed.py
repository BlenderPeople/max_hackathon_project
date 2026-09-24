"""Idempotent local demo data. Run after Alembic migration."""

from decimal import Decimal

from sqlalchemy import select

from app.core.config import settings
from app.db.session import SessionLocal
from app.domain.models import Business, Order, OrderEvent, OrderStage, Service, User, utcnow


def seed() -> None:
    with SessionLocal.begin() as db:
        master = db.scalar(select(User).where(User.max_user_id == settings.demo_master_max_id))
        if master is None:
            master = User(max_user_id=settings.demo_master_max_id, first_name="Сергей", last_name="Мастер")
            db.add(master)
            db.flush()
        customer = db.scalar(select(User).where(User.max_user_id == settings.demo_customer_max_id))
        if customer is None:
            customer = User(max_user_id=settings.demo_customer_max_id, first_name="Клиент", last_name="Демо")
            db.add(customer)
            db.flush()
        business = db.scalar(select(Business).where(Business.owner_id == master.id))
        if business is None:
            business = Business(owner=master, name="Зелёный двор", description="Уход за деревьями и садом",
                                specialization="Арбористика и уход за садом")
            db.add(business)
            db.flush()
        service = db.scalar(select(Service).where(Service.business_id == business.id, Service.title == "Обрезка деревьев"))
        if service is None:
            service = Service(business=business, title="Обрезка деревьев", description="Обрезка плодовых деревьев",
                              price_from=Decimal("5000.00"), duration_minutes=120,
                              image_url="/assets/tree-pruning.jpg", is_active=True)
            db.add(service)
            db.flush()
        order = db.scalar(select(Order).where(Order.business_id == business.id, Order.customer_id == customer.id,
                                          Order.service_id == service.id))
        if order is None:
            now = utcnow()
            order = Order(business=business, customer=customer, service=service, title=service.title,
                          description="Обрезать две яблони", status="new", price=None,
                          created_at=now, updated_at=now)
            order.stages = [OrderStage(position=index, title=title) for index, title in enumerate(
                ("Осмотр и оценка", "Выполнение работ", "Приёмка"), start=1)]
            order.events = [OrderEvent(actor_id=customer.id, type="order.created", title="Заказ создан",
                                       payload={"service_token": service.public_token}, created_at=now)]
            db.add(order)
            db.flush()
        print(f"service={service.public_token} order={order.public_token}")


if __name__ == "__main__":
    seed()
