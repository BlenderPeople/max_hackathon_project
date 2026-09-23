"""Private local object storage for the hackathon demo."""

import os
import re
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.domain.models import Order, OrderFile, User
from app.services.domain import add_event

ALLOWED_TYPES = {"application/pdf", "image/jpeg", "image/png", "text/plain"}
CHUNK_SIZE = 1024 * 1024


def safe_name(raw: str | None) -> str:
    name = (raw or "").replace("\\", "/").split("/")[-1].strip()
    if not name or name in {".", ".."} or len(name) > 255 or any(ord(char) < 32 for char in name):
        raise HTTPException(status_code=422, detail="invalid filename")
    return name


def storage_path(key: str) -> Path:
    if not re.fullmatch(r"[0-9a-f]{32}", key):
        raise HTTPException(status_code=404, detail="file not found")
    return Path(settings.file_storage_dir) / key


def store_order_file(db: Session, order: Order, user: User, upload: UploadFile) -> OrderFile:
    filename = safe_name(upload.filename)
    content_type = (upload.content_type or "").lower()
    if content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=415, detail="unsupported file type")

    directory = Path(settings.file_storage_dir)
    directory.mkdir(parents=True, exist_ok=True, mode=0o700)
    key = uuid4().hex
    path = storage_path(key)
    size = 0
    try:
        descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(descriptor, "wb") as target:
            first = True
            while chunk := upload.file.read(CHUNK_SIZE):
                if first:
                    first = False
                    signatures = {
                        "application/pdf": chunk.startswith(b"%PDF-"),
                        "image/jpeg": chunk.startswith(b"\xff\xd8\xff"),
                        "image/png": chunk.startswith(b"\x89PNG\r\n\x1a\n"),
                        "text/plain": b"\x00" not in chunk,
                    }
                    if not signatures[content_type]:
                        raise HTTPException(status_code=415, detail="file content does not match type")
                size += len(chunk)
                if size > settings.max_upload_bytes:
                    raise HTTPException(status_code=413, detail="file is too large")
                target.write(chunk)
        if size == 0:
            raise HTTPException(status_code=422, detail="empty file")
        record = OrderFile(order=order, storage_key=key, filename=filename,
                           content_type=content_type, size=size, uploaded_by_id=user.id)
        db.add(record)
        add_event(order, user, "file.uploaded", f"Добавлен файл «{filename}»")
        db.commit()
        return record
    except Exception:
        db.rollback()
        path.unlink(missing_ok=True)
        raise
