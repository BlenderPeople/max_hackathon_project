"""Verify MAX_BOT_TOKEN without writing the token to stdout or logs.

Run inside the API container:
    docker compose run --rm api python scripts/verify_max_token.py
"""

import asyncio
import sys

import httpx

from app.core.config import settings
from app.integrations.max.client import MaxBotClient


async def main() -> int:
    if not settings.max_bot_token:
        print("MAX_BOT_TOKEN is empty. Add it to the local .env file first.")
        return 2

    client = MaxBotClient(
        settings.max_bot_token,
        settings.max_api_base_url,
        settings.max_ca_bundle_path,
    )
    try:
        bot = await client.get_me()
    except httpx.HTTPStatusError as error:
        print(f"MAX token verification failed: HTTP {error.response.status_code}")
        return 1
    except httpx.HTTPError:
        print("MAX token verification failed: network or TLS error")
        return 1

    # Only stable public properties are shown; the token is never printed.
    public = {key: bot[key] for key in ("bot_id", "id", "username", "name") if key in bot}
    print(f"MAX token is valid. Public bot data: {public}")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
