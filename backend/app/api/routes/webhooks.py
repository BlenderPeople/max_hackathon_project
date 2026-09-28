import hashlib
import hmac
import json
import logging

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import get_db_session
from app.core.config import settings
from app.domain.models import WebhookReceipt
from app.integrations.max.client import MaxBotClient

router = APIRouter(prefix="/webhooks", tags=["max"])
logger = logging.getLogger(__name__)


def _started_user_id(payload: dict[str, object]) -> int | None:
    """Return a safe recipient id from a MAX bot_started event, if present."""
    user = payload.get("user")
    if not isinstance(user, dict):
        return None
    user_id = user.get("id")
    if isinstance(user_id, bool):
        return None
    try:
        value = int(user_id)
    except (TypeError, ValueError):
        return None
    return value if value > 0 else None


async def _send_start_message(payload: dict[str, object]) -> None:
    """Answer a bot start with a MAX deep link to the attached Mini App."""
    recipient_id = _started_user_id(payload)
    if recipient_id is None or not settings.max_bot_token or not settings.max_bot_username:
        return
    bot_name = settings.max_bot_username.lstrip("@")
    app_link = f"https://max.ru/{bot_name}?startapp"
    client = MaxBotClient(settings.max_bot_token, settings.max_api_base_url, settings.max_ca_bundle_path)
    try:
        await client.send_text(
            recipient_id,
            "Добро пожаловать! Откройте приложение, чтобы создать или вести заказ.",
            link_url=app_link,
        )
    except Exception as exc:
        # The event is already stored; returning 200 prevents duplicate greetings.
        logger.warning("MAX start reply failed (%s)", type(exc).__name__)


@router.post("/max", status_code=status.HTTP_200_OK)
async def receive_max_webhook(
    request: Request,
    x_max_bot_api_secret: str | None = Header(default=None),
    db: Session = Depends(get_db_session),
) -> dict[str, bool]:
    """Validate and durably deduplicate a MAX delivery without storing PII."""
    if not settings.max_webhook_secret:
        raise HTTPException(status_code=503, detail="webhook is not configured")
    if not x_max_bot_api_secret or not hmac.compare_digest(x_max_bot_api_secret, settings.max_webhook_secret):
        raise HTTPException(status_code=401, detail="invalid webhook secret")

    raw = await request.body()
    if len(raw) > 262_144:
        raise HTTPException(status_code=413, detail="webhook payload too large")
    try:
        payload = json.loads(raw)
    except (ValueError, UnicodeDecodeError):
        raise HTTPException(status_code=400, detail="invalid webhook JSON") from None
    if not isinstance(payload, dict) or not isinstance(payload.get("update_type"), str):
        raise HTTPException(status_code=422, detail="invalid MAX update")
    fingerprint = hashlib.sha256(raw).hexdigest()
    if db.scalar(select(WebhookReceipt.id).where(WebhookReceipt.payload_hash == fingerprint)) is not None:
        return {"accepted": True}
    db.add(WebhookReceipt(payload_hash=fingerprint, update_type=payload["update_type"][:64]))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return {"accepted": True}
    if payload["update_type"] == "bot_started":
        await _send_start_message(payload)
    return {"accepted": True}
