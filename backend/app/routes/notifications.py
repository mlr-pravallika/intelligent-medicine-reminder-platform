from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models import User
from app import crud, schemas

router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)


@router.get(
    "/",
    response_model=list[schemas.NotificationResponse]
)
def notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return crud.get_notifications(
        db,
        current_user.id
    )

@router.put("/{notification_id}/read")
def mark_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return crud.mark_notification_read(
        db,
        notification_id,
        current_user.id
    )

@router.patch("/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return crud.mark_all_notifications_read(
        db,
        current_user.id
    )