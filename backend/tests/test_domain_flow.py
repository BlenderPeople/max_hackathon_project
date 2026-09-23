import asyncio
import hashlib
import hmac
import json
import os
import tempfile
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode
from zoneinfo import ZoneInfo

os.environ["DATABASE_URL"] = "sqlite://"
os.environ["MAX_BOT_TOKEN"] = "test-bot-token"

from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402
from sqlalchemy import select  # noqa: E402

from app.api.dependencies import get_db_session  # noqa: E402
from app.db.session import Base  # noqa: E402
from app.core.config import settings  # noqa: E402
from app.domain.models import NotificationOutbox, utcnow  # noqa: E402
from app.main import app  # noqa: E402
from app.notification_worker import dispatch_once  # noqa: E402
from app import seed as seed_module  # noqa: E402
from app.domain.models import Business, Service, User  # noqa: E402


def signed_init_data(user_id: int, *, hours_old: int = 0) -> str:
    values = {
        "auth_date": str(int((datetime.now(timezone.utc) - timedelta(hours=hours_old)).timestamp())),
        "user": json.dumps({"id": user_id, "first_name": f"User {user_id}"}, separators=(",", ":")),
    }
    check = "\n".join(f"{key}={value}" for key, value in sorted(values.items()))
    secret = hmac.new(b"WebAppData", b"test-bot-token", hashlib.sha256).digest()
    values["hash"] = hmac.new(secret, check.encode(), hashlib.sha256).hexdigest()
    return urlencode(values)


def test_signed_login_order_permissions_and_booking_flow() -> None:
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    sessions = sessionmaker(engine, expire_on_commit=False)
    storage = tempfile.TemporaryDirectory()
    previous_storage = settings.file_storage_dir
    previous_limit = settings.max_upload_bytes
    settings.file_storage_dir = storage.name

    def db_override():
        with sessions() as session:
            yield session

    app.dependency_overrides[get_db_session] = db_override
    try:
        with TestClient(app) as http:
            assert http.post("/api/auth/max", json={"init_data": signed_init_data(1, hours_old=2)}).status_code == 401
            invalid = signed_init_data(1) + "&hash=" + "0" * 64
            assert http.post("/api/auth/max", json={"init_data": invalid}).status_code == 401

            def login(user_id: int) -> dict:
                response = http.post("/api/auth/max", json={"init_data": signed_init_data(user_id)})
                assert response.status_code == 200, response.text
                return {"Authorization": f"Bearer {response.json()['session_token']}"}

            master = login(101)
            customer = login(202)
            stranger = login(303)
            service_response = http.post("/api/services", headers=master, json={
                "title": "Обрезка деревьев", "description": "Работа на участке", "price_from": "5000.00",
                "duration_minutes": 120, "image_data_url": None,
            })
            assert service_response.status_code == 201, service_response.text
            service_token = service_response.json()["public_token"]
            business_token = http.get("/api/businesses/me", headers=master).json()["public_token"]
            # Public business handles use the same opaque token convention as services/orders.
            public_business = http.get(f"/api/businesses/{business_token}")
            assert public_business.status_code == 200
            public_services = http.get(f"/api/businesses/{business_token}/services")
            assert public_services.status_code == 200 and public_services.json()[0]["public_token"] == service_token
            assert http.post("/api/services", headers=customer, json={
                "title": "Осмотр", "description": "", "price_from": "100.00", "duration_minutes": 60,
            }).status_code == 201

            zone = ZoneInfo("Asia/Novosibirsk")
            day = datetime.now(zone).date() + timedelta(days=1)
            while day.isoweekday() > 5:
                day += timedelta(days=1)
            slots_response = http.get(f"/api/services/{service_token}/availability", params={"date": day.isoformat()})
            assert slots_response.status_code == 200, slots_response.text
            slot = slots_response.json()[0]
            order_input = {"service_public_token": service_token, "description": "Обрезать две яблони",
                           "due_at": slot["end_at"], "scheduled_start_at": slot["start_at"],
                           "scheduled_end_at": slot["end_at"]}
            created = http.post("/api/orders", headers=customer, json=order_input)
            assert created.status_code == 201, created.text
            token = created.json()["public_token"]
            assert http.post("/api/orders", headers=stranger, json=order_input).status_code == 409
            assert http.get(f"/api/orders/{token}", headers=stranger).status_code == 403
            upload = http.post(f"/api/orders/{token}/files", headers=customer,
                               files={"file": ("report.txt", b"Hello file", "text/plain")})
            assert upload.status_code == 201, upload.text
            file_token = upload.json()["id"]
            assert http.get(f"/api/files/{file_token}/download", headers=stranger).status_code == 403
            downloaded = http.get(f"/api/files/{file_token}/download", headers=master)
            assert downloaded.status_code == 200 and downloaded.content == b"Hello file"
            assert downloaded.headers["x-content-type-options"] == "nosniff"
            assert http.post(f"/api/orders/{token}/files", headers=stranger,
                             files={"file": ("bad.txt", b"x", "text/plain")}).status_code == 403
            assert http.post(f"/api/orders/{token}/files", headers=customer,
                             files={"file": ("bad.exe", b"x", "application/octet-stream")}).status_code == 415
            settings.max_upload_bytes = 4
            assert http.post(f"/api/orders/{token}/files", headers=customer,
                             files={"file": ("large.txt", b"12345", "text/plain")}).status_code == 413
            settings.max_upload_bytes = previous_limit
            assert len(http.get(f"/api/orders/{token}", headers=customer).json()["files"]) == 1
            assert http.patch(f"/api/orders/{token}", headers=customer, json={"price": "6000.00"}).status_code == 403
            edited = http.patch(f"/api/orders/{token}", headers=master, json={"price": "6000.00"})
            assert edited.status_code == 200, edited.text
            approval = http.post(f"/api/orders/{token}/approvals", headers=master,
                                 json={"title": "Согласование стоимости"})
            assert approval.status_code == 200, approval.text
            assert "update" not in approval.json()["available_actions"]
            assert http.patch(f"/api/orders/{token}", headers=master,
                              json={"description": "Иная работа после запроса"}).status_code == 409
            approval_token = approval.json()["pending_approval"]["id"]
            assert http.post(f"/api/approvals/{approval_token}/decision", headers=master,
                             json={"approved": True}).status_code == 403
            decided = http.post(f"/api/approvals/{approval_token}/decision", headers=customer,
                                json={"approved": True})
            assert decided.status_code == 200, decided.text
            assert decided.json()["status"] == "in_progress"
            assert http.post(f"/api/approvals/{approval_token}/decision", headers=customer,
                             json={"approved": True}).status_code == 409
            assert http.patch(f"/api/orders/{token}", headers=master,
                              json={"price": "7000.00"}).status_code == 409
            stage = decided.json()["stages"][0]["id"]
            assert http.post(f"/api/orders/{token}/stages/{stage}/activate", headers=customer).status_code == 403
            assert http.post(f"/api/orders/{token}/stages/{stage}/activate", headers=master).status_code == 200
            assert http.post(f"/api/orders/{token}/payments", headers=master,
                             json={"amount": "2000.00", "comment": "Предоплата"}).status_code == 200
            assert http.post(f"/api/orders/{token}/payments", headers=master,
                             json={"amount": "5000.00", "comment": ""}).status_code == 409
            for next_stage in decided.json()["stages"][1:]:
                assert http.post(f"/api/orders/{token}/stages/{next_stage['id']}/activate", headers=master).status_code == 200
            completed = http.post(f"/api/orders/{token}/complete", headers=master)
            assert completed.status_code == 200, completed.text
            assert completed.json()["status"] == "done"
            assert http.get("/api/orders?filter=completed", headers=customer).json()[0]["public_token"] == token
            assert http.get("/api/orders?filter=active", headers=stranger).json() == []
            assert http.get(f"/api/orders/{token}/events", headers=customer).json()[0]["type"] == "order.completed"

            with sessions() as db:
                notifications = db.scalars(select(NotificationOutbox).order_by(NotificationOutbox.id)).all()
                assert len(notifications) == 8
                assert notifications[0].recipient.max_user_id == "101"
                assert notifications[1].recipient.max_user_id == "202"
                assert all(item.status == "pending" for item in notifications)

            class FakeClient:
                def __init__(self):
                    self.calls = []
                    self.fail = True

                async def send_text(self, user_id, text, *, link_url=None):
                    self.calls.append((user_id, text, link_url))
                    if self.fail:
                        raise ConnectionError("temporary")

            fake = FakeClient()
            assert asyncio.run(dispatch_once(sessions, fake, "test_bot"))
            with sessions() as db:
                first = db.get(NotificationOutbox, notifications[0].id)
                assert first.status == "pending" and first.attempts == 1
                first.next_attempt_at = utcnow() - timedelta(seconds=1)
                db.commit()
            fake.fail = False
            assert asyncio.run(dispatch_once(sessions, fake, "test_bot"))
            with sessions() as db:
                first = db.get(NotificationOutbox, notifications[0].id)
                assert first.status == "sent" and first.sent_at is not None
            assert fake.calls[-1][0] == 101
            assert fake.calls[-1][2] == f"https://max.ru/test_bot?startapp=order_{token}"

            next_slot = http.get(f"/api/services/{service_token}/availability",
                                 params={"date": day.isoformat()}).json()[0]
            second_input = {**order_input, "scheduled_start_at": next_slot["start_at"],
                            "scheduled_end_at": next_slot["end_at"], "due_at": next_slot["end_at"]}
            second = http.post("/api/orders", headers=customer, json=second_input)
            assert second.status_code == 201, second.text
            second_token = second.json()["public_token"]
            assert http.patch(f"/api/orders/{second_token}", headers=master,
                              json={"price": "5000.00"}).status_code == 200
            first_request = http.post(f"/api/orders/{second_token}/approvals", headers=master,
                                      json={"title": "Цена"})
            assert first_request.status_code == 200
            rejected = http.post(f"/api/approvals/{first_request.json()['pending_approval']['id']}/decision",
                                 headers=customer, json={"approved": False})
            assert rejected.status_code == 200 and rejected.json()["status"] == "new"
            assert http.patch(f"/api/orders/{second_token}", headers=master,
                              json={"price": "4500.00"}).status_code == 200
            retry = http.post(f"/api/orders/{second_token}/approvals", headers=master,
                              json={"title": "Обновлённая цена"})
            assert retry.status_code == 200
            assert retry.json()["pending_approval"]["amount"] == "4500.00"
    finally:
        settings.file_storage_dir = previous_storage
        settings.max_upload_bytes = previous_limit
        storage.cleanup()
        app.dependency_overrides.clear()
        engine.dispose()


def test_demo_seed_can_run_twice_without_replacing_edits(monkeypatch) -> None:
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    sessions = sessionmaker(engine, expire_on_commit=False)
    monkeypatch.setattr(seed_module, "SessionLocal", sessions)
    try:
        seed_module.seed()
        with sessions.begin() as db:
            business = db.scalar(select(Business))
            business.name = "Название после редактирования"
        seed_module.seed()
        with sessions() as db:
            assert db.scalar(select(Business)).name == "Название после редактирования"
            assert len(db.scalars(select(User)).all()) == 2
            assert len(db.scalars(select(Service)).all()) == 1
    finally:
        engine.dispose()
