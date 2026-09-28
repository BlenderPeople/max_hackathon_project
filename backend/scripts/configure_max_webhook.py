"""Register the production MAX webhook without printing secrets.

Run inside the API container after HTTPS is available:
    docker compose -f docker-compose.prod.yml run --rm api python scripts/configure_max_webhook.py
"""

import asyncio
import sys
from urllib.parse import urlparse

import httpx

from app.core.config import settings
from app.integrations.max.client import MaxBotClient


async def main() -> int:
    if not settings.max_bot_token or not settings.max_webhook_secret or not settings.max_app_url:
        print("MAX_BOT_TOKEN, MAX_WEBHOOK_SECRET and MAX_APP_URL must be set.")
        return 2
    parsed = urlparse(settings.max_app_url)
    if parsed.scheme != "https" or not parsed.netloc:
        print("MAX_APP_URL must be a public HTTPS URL.")
        return 2

    webhook_url = f"{settings.max_app_url.rstrip('/')}/webhooks/max"
    client = MaxBotClient(settings.max_bot_token, settings.max_api_base_url, settings.max_ca_bundle_path)
    try:
        await client.configure_webhook(
            url=webhook_url,
            secret=settings.max_webhook_secret,
            update_types=["bot_started", "message_created"],
        )
    except httpx.HTTPStatusError as error:
        print(f"MAX webhook configuration failed: HTTP {error.response.status_code}")
        return 1
    except httpx.HTTPError:
        print("MAX webhook configuration failed: network or TLS error")
        return 1
    except RuntimeError:
        print("MAX webhook configuration was rejected by MAX. Check the public HTTPS URL and secret.")
        return 1
    print(f"MAX webhook configured: {webhook_url}")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
