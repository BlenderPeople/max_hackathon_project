from fastapi import APIRouter, Header, HTTPException, Request, status

from app.core.config import settings

router = APIRouter(prefix="/webhooks", tags=["max"])


@router.post("/max", status_code=status.HTTP_200_OK)
async def receive_max_webhook(
    request: Request,
    x_max_bot_api_secret: str | None = Header(default=None),
) -> dict[str, bool]:
    """Minimal verified webhook boundary.

    Deduplication and handing the event to an outbox worker belong in
    ``app.integrations.max`` once MAX event examples are agreed with the team.
    """
    if not settings.max_webhook_secret:
        raise HTTPException(status_code=503, detail="webhook is not configured")
    if x_max_bot_api_secret != settings.max_webhook_secret:
        raise HTTPException(status_code=401, detail="invalid webhook secret")

    # Parse now to reject malformed JSON. Do not log request data: it may contain PII.
    await request.json()
    return {"accepted": True}
