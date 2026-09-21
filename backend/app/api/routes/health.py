from fastapi import APIRouter, HTTPException, status
from sqlalchemy import text

from app.db.session import engine

router = APIRouter(tags=["system"])


@router.get("/healthz")
def healthcheck() -> dict[str, str]:
    """Check that API and PostgreSQL are reachable."""
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="database is unavailable",
        ) from error
    return {"status": "ok"}
