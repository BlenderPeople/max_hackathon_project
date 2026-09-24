import hashlib
import hmac
import json

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import get_db_session
from app.core.config import settings
from app.domain.models import WebhookReceipt

router = APIRouter(prefix="/webhooks", tags=["max"])


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
