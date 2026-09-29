import hashlib
import hmac
import json
from datetime import datetime, timedelta, timezone
from secrets import token_urlsafe
from urllib.parse import parse_qsl

from fastapi import Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_db_session
from app.core.config import settings
from app.domain.models import Business, SessionToken, User, utcnow


def validate_init_data(init_data: str) -> dict:
    """Validate MAX WebAppData per https://dev.max.ru/docs/webapps/validation."""
    if not settings.max_bot_token:
        raise HTTPException(status_code=503, detail="MAX auth is not configured")
    if len(init_data) > 16384:
        raise HTTPException(status_code=401, detail="invalid initData")
    try:
        pairs = parse_qsl(init_data, keep_blank_values=True, strict_parsing=True)
        values = dict(pairs)
        if len(pairs) != len(values) or not {"hash", "auth_date", "user"}.issubset(values):
            raise ValueError("missing or duplicate fields")
        supplied_hash = values.pop("hash")
        if len(supplied_hash) != 64:
            raise ValueError("invalid hash")
        check_string = "\n".join(f"{key}={value}" for key, value in sorted(values.items()))
        secret = hmac.new(b"WebAppData", settings.max_bot_token.encode(), hashlib.sha256).digest()
        expected_hash = hmac.new(secret, check_string.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected_hash, supplied_hash):
            raise ValueError("bad signature")
        timestamp = datetime.fromtimestamp(int(values["auth_date"]), timezone.utc)
        age = utcnow() - timestamp
        if age > timedelta(seconds=settings.max_init_data_max_age_seconds) or age < timedelta(seconds=-60):
            raise ValueError("stale or future timestamp")
        user = json.loads(values["user"])
        if not isinstance(user, dict) or isinstance(user.get("id"), bool) or not str(user.get("id", "")).isdigit():
            raise ValueError("invalid user")
        if len(str(user["id"])) > 64 or not isinstance(user.get("first_name"), str) or not user["first_name"].strip():
            raise ValueError("invalid user fields")
        if len(user["first_name"]) > 255 or (user.get("last_name") is not None and (not isinstance(user["last_name"], str) or len(user["last_name"]) > 255)):
            raise ValueError("invalid name")
        username = user.get("username")
        if username is not None and (not isinstance(username, str) or len(username) > 255):
            raise ValueError("invalid username")
        return user
    except (ValueError, TypeError, OverflowError, UnicodeError):
        raise HTTPException(status_code=401, detail="invalid or expired MAX initData") from None


def digest(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def create_session(db: Session, max_user: dict) -> tuple[User, str, datetime]:
    username = max_user.get("username")
    if isinstance(username, str):
        # MAX sends a handle without @; users type it with @ in the search UI.
        username = username.strip().lstrip("@") or None
    user = db.scalar(select(User).where(User.max_user_id == str(max_user["id"])))
    if user is None:
        user = User(max_user_id=str(max_user["id"]), username=username,
                    first_name=max_user["first_name"], last_name=max_user.get("last_name"))
        db.add(user)
        db.flush()
        db.add(Business(owner=user, name=f"{user.first_name} — мастер"))
    else:
        user.first_name = max_user["first_name"]
        user.last_name = max_user.get("last_name")
        user.username = username
    token = token_urlsafe(32)
    expires_at = utcnow() + timedelta(seconds=settings.session_ttl_seconds)
    db.add(SessionToken(token_hash=digest(token), user=user, expires_at=expires_at))
    db.commit()
    return user, token, expires_at


def current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db_session),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="missing session")
    token = authorization[7:]
    if not token or len(token) > 256:
        raise HTTPException(status_code=401, detail="invalid session")
    session = db.scalar(select(SessionToken).where(SessionToken.token_hash == digest(token)))
    if session is None:
        raise HTTPException(status_code=401, detail="invalid session")
    expires_at = session.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at <= utcnow():
        raise HTTPException(status_code=401, detail="expired session")
    return session.user
