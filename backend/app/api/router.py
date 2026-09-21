from fastapi import APIRouter

from app.api.routes import health, webhooks

api_router = APIRouter()
api_router.include_router(health.router)

# MAX calls this endpoint without the /api prefix.
webhook_router = APIRouter()
webhook_router.include_router(webhooks.router)
