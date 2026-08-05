from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.auth import get_current_user
from app.models import ReminderHistory, User

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)


@router.get("/summary")
def analytics_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    reminders = (
        db.query(ReminderHistory)
        .filter(
            ReminderHistory.user_id == current_user.id
        )
        .all()
    )

    total = len(reminders)

    taken = len([
        r for r in reminders
        if r.status == "Taken"
    ])

    missed = len([
        r for r in reminders
        if r.status == "Missed"
    ])

    adherence = 0

    if total > 0:
        adherence = round((taken / total) * 100, 1)

    return {
        "total": total,
        "taken": taken,
        "missed": missed,
        "adherence": adherence
    }


@router.get("/most-missed")
def most_missed(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    result = (
        db.query(
            ReminderHistory.medicine_name,
            func.count(ReminderHistory.id).label("count")
        )
        .filter(
            ReminderHistory.user_id == current_user.id,
            ReminderHistory.status == "Missed"
        )
        .group_by(ReminderHistory.medicine_name)
        .order_by(func.count(ReminderHistory.id).desc())
        .first()
    )

    if result:
        return {
            "medicine": result.medicine_name,
            "count": result.count
        }

    return {
        "medicine": None,
        "count": 0
    }