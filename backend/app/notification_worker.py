"""Deliver committed order events to MAX with bounded retries.

The outbox is at-least-once: if a process dies after MAX accepts a message but
before the database marks it sent, the message may be delivered twice.
"""

import asyncio
import logging
from datetime import timedelta

from sqlalchemy import and_, or_, select
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.db.session import engine
from app.domain.models import NotificationOutbox, utcnow
from app.integrations.max.client import MaxBotClient

logger = logging.getLogger(__name__)
MAX_FAILURES = 5
LEASE_SECONDS = 60


async def dispatch_once(sessions: sessionmaker, client: MaxBotClient, bot_username: str) -> bool:
    """Claim one due message and deliver it. Return False when no work is due."""
    now = utcnow()
    with sessions() as db:
        message = db.scalar(
            select(NotificationOutbox)
            .where(NotificationOutbox.attempts < MAX_FAILURES)
            .where(or_(
                and_(NotificationOutbox.status == "pending", NotificationOutbox.next_attempt_at <= now),
                and_(NotificationOutbox.status == "processing", NotificationOutbox.lease_until < now),
            ))
            .order_by(NotificationOutbox.id)
            .with_for_update(skip_locked=True)
            .limit(1)
        )
        if message is None:
            return False
        message.status = "processing"
        message.lease_until = now + timedelta(seconds=LEASE_SECONDS)
        message_id = message.id
        recipient_id = int(message.recipient.max_user_id)
        title = message.event.title
        order_title = message.order.title
        order_token = message.order.public_token
        db.commit()

    link = f"https://max.ru/{bot_username.lstrip('@')}?startapp=order_{order_token}"
    try:
        await client.send_text(recipient_id, f"{title}\nЗаказ: {order_title}", link_url=link)
    except Exception as exc:
        with sessions() as db:
            message = db.get(NotificationOutbox, message_id)
            message.attempts += 1
            message.status = "failed" if message.attempts >= MAX_FAILURES else "pending"
            message.next_attempt_at = utcnow() + timedelta(seconds=min(60 * 2 ** message.attempts, 3600))
            message.lease_until = None
            message.last_error = type(exc).__name__[:255]
            db.commit()
        logger.warning("MAX notification %s failed (%s)", message_id, type(exc).__name__)
    else:
        with sessions() as db:
            message = db.get(NotificationOutbox, message_id)
            message.status = "sent"
            message.sent_at = utcnow()
            message.lease_until = None
            message.last_error = None
            db.commit()
    return True


async def run() -> None:
    if not settings.max_bot_token or not settings.max_bot_username:
        raise RuntimeError("MAX_BOT_TOKEN and MAX_BOT_USERNAME are required for notification worker")
    sessions = sessionmaker(engine, expire_on_commit=False)
    client = MaxBotClient(settings.max_bot_token, settings.max_api_base_url, settings.max_ca_bundle_path)
    while True:
        if not await dispatch_once(sessions, client, settings.max_bot_username):
            await asyncio.sleep(3)


if __name__ == "__main__":
    asyncio.run(run())
