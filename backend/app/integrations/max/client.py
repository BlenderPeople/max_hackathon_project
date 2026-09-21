from collections.abc import Mapping
import ssl

import httpx


class MaxBotClient:
    """Small, testable boundary for the official MAX Bot HTTP API.

    The access token lives only in backend configuration. TLS certificate
    verification deliberately stays enabled.
    """

    def __init__(self, token: str, base_url: str, ca_bundle_path: str) -> None:
        self._token = token
        self._base_url = base_url.rstrip("/")
        # httpx otherwise uses certifi's bundle, which does not include the
        # Russian Trusted CA chain installed in this container's system bundle.
        self._ssl_context = ssl.create_default_context(cafile=ca_bundle_path)

    @property
    def _headers(self) -> dict[str, str]:
        return {"Authorization": self._token}

    async def get_me(self) -> Mapping[str, object]:
        """Verify the token without logging or returning it."""
        async with httpx.AsyncClient(
            base_url=self._base_url,
            headers=self._headers,
            verify=self._ssl_context,
            timeout=10.0,
        ) as client:
            response = await client.get("/me")
            response.raise_for_status()
            return response.json()

    async def send_text(self, user_id: int, text: str) -> Mapping[str, object]:
        """Send a plain message; notification templates are added later."""
        async with httpx.AsyncClient(
            base_url=self._base_url,
            headers=self._headers,
            verify=self._ssl_context,
            timeout=10.0,
        ) as client:
            response = await client.post(
                "/messages",
                params={"user_id": user_id},
                json={"text": text},
            )
            response.raise_for_status()
            return response.json()
