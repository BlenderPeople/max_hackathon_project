from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_db_session
from app.api.schemas.domain import OrderFileView
from app.domain.models import OrderFile, User
from app.services.auth import current_user
from app.services.domain import utc, visible_order
from app.services.files import storage_path, store_order_file

router = APIRouter(tags=["files"])


@router.post("/orders/{public_token}/files", response_model=OrderFileView, status_code=201)
def upload_file(public_token: str, file: UploadFile, db: Session = Depends(get_db_session),
                user: User = Depends(current_user)) -> dict:
    order = visible_order(db, public_token, user)
    record = store_order_file(db, order, user, file)
    return {"id": record.public_token, "filename": record.filename,
            "content_type": record.content_type, "size": record.size,
            "created_at": utc(record.created_at)}


@router.get("/files/{file_token}/download")
def download_file(file_token: str, db: Session = Depends(get_db_session),
                  user: User = Depends(current_user)) -> FileResponse:
    record = db.scalar(select(OrderFile).where(OrderFile.public_token == file_token))
    if record is None:
        raise HTTPException(status_code=404, detail="file not found")
    visible_order(db, record.order.public_token, user)
    path = storage_path(record.storage_key)
    if not path.is_file():
        raise HTTPException(status_code=404, detail="file not found")
    return FileResponse(path, media_type=record.content_type, filename=record.filename,
                        content_disposition_type="attachment",
                        headers={"X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store"})
