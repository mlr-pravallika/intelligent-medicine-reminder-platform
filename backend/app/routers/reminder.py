from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.email_service import send_email
from app.models import (
    Medicine,
    Notification,
    ReminderHistory,
    User,
)
from app.sms_service import send_sms


router = APIRouter(
    prefix="/reminders",
    tags=["Reminders"],
)


# ============================================================
# REQUEST MODEL
# ============================================================

class ReminderActionRequest(BaseModel):
    reminder_time: Optional[str] = None


# ============================================================
# HELPERS
# ============================================================

def get_user_medicine(
    medicine_id: int,
    current_user: User,
    db: Session,
) -> Medicine:

    medicine = (
        db.query(Medicine)
        .filter(
            Medicine.id == medicine_id,
            Medicine.user_id == current_user.id,
        )
        .first()
    )

    if not medicine:
        raise HTTPException(
            status_code=404,
            detail="Medicine not found.",
        )

    return medicine


def get_specific_reminder_time(
    medicine: Medicine,
    requested_time: Optional[str],
) -> str:

    if requested_time:
        return requested_time.strip()

    reminder_times = [
        item.strip()
        for item in (
            medicine.reminder_time or ""
        ).split(",")
        if item.strip()
    ]

    if reminder_times:
        return reminder_times[0]

    return ""


def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
) -> None:

    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type="Reminder",
        channel="App",
        is_read=False,
    )

    db.add(notification)


def safe_email(
    current_user: User,
    medicine: Medicine,
    reminder_time: str,
) -> None:

    try:
        send_email(
            receiver_email=current_user.email,
            medicine_name=medicine.medicine_name,
            dosage=medicine.dosage,
            reminder_time=reminder_time,
        )
    except Exception as exc:
        print(
            "Email delivery failed:",
            repr(exc),
        )


def safe_sms(
    current_user: User,
    medicine: Medicine,
    reminder_time: str,
) -> None:

    try:
        send_sms(
            current_user.phone,
            current_user.name,
            medicine.medicine_name,
            medicine.dosage,
            reminder_time,
        )
    except Exception as exc:
        print(
            "SMS delivery failed:",
            repr(exc),
        )


# ============================================================
# TAKEN
# ============================================================

@router.post("/{medicine_id}/taken")
def mark_taken(
    medicine_id: int,
    payload: Optional[
        ReminderActionRequest
    ] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    medicine = get_user_medicine(
        medicine_id,
        current_user,
        db,
    )

    reminder_time = get_specific_reminder_time(
        medicine,
        payload.reminder_time
        if payload
        else None,
    )

    # One clicked reminder = one dose.
    medicine.remaining_quantity = max(
        0,
        int(
            medicine.remaining_quantity or 0
        ) - 1,
    )

    history = ReminderHistory(
        user_id=current_user.id,
        medicine_name=medicine.medicine_name,
        dosage=medicine.dosage,
        reminder_time=reminder_time,
        status="Taken",
    )

    db.add(history)

    create_notification(
        db=db,
        user_id=current_user.id,
        title="Medicine Taken",
        message=(
            f"You have taken "
            f"{medicine.medicine_name} "
            f"({medicine.dosage})."
        ),
    )

    # Commit the actual medication action first.
    db.commit()

    # External notification failures must NOT
    # change the result of the medicine action.
    safe_email(
        current_user,
        medicine,
        reminder_time,
    )

    safe_sms(
        current_user,
        medicine,
        reminder_time,
    )

    return {
        "success": True,
        "status": "Taken",
        "medicine_id": medicine.id,
        "medicine_name": medicine.medicine_name,
        "reminder_time": reminder_time,
        "message": "Dose marked as taken.",
    }


# ============================================================
# MISSED
# ============================================================

@router.post("/{medicine_id}/missed")
def mark_missed(
    medicine_id: int,
    payload: Optional[
        ReminderActionRequest
    ] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    medicine = get_user_medicine(
        medicine_id,
        current_user,
        db,
    )

    reminder_time = get_specific_reminder_time(
        medicine,
        payload.reminder_time
        if payload
        else None,
    )

    history = ReminderHistory(
        user_id=current_user.id,
        medicine_name=medicine.medicine_name,
        dosage=medicine.dosage,
        reminder_time=reminder_time,
        status="Missed",
    )

    db.add(history)

    create_notification(
        db=db,
        user_id=current_user.id,
        title="Medicine Missed",
        message=(
            f"You missed "
            f"{medicine.medicine_name} "
            f"({medicine.dosage})."
        ),
    )

    db.commit()

    safe_email(
        current_user,
        medicine,
        reminder_time,
    )

    safe_sms(
        current_user,
        medicine,
        reminder_time,
    )

    return {
        "success": True,
        "status": "Missed",
        "medicine_id": medicine.id,
        "medicine_name": medicine.medicine_name,
        "reminder_time": reminder_time,
        "message": "Dose marked as missed.",
    }


# ============================================================
# SKIPPED
# ============================================================

@router.post("/{medicine_id}/snooze")
def snooze_reminder(
    medicine_id: int,
    payload: Optional[
        ReminderActionRequest
    ] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    medicine = get_user_medicine(
        medicine_id,
        current_user,
        db,
    )

    reminder_time = get_specific_reminder_time(
        medicine,
        payload.reminder_time
        if payload
        else None,
    )

    history = ReminderHistory(
        user_id=current_user.id,
        medicine_name=medicine.medicine_name,
        dosage=medicine.dosage,
        reminder_time=reminder_time,
        status="Snoozed",
    )

    db.add(history)

    create_notification(
        db=db,
        user_id=current_user.id,
        title="Reminder Snoozed",
        message=(
            f"{medicine.medicine_name} "
            "reminder snoozed."
        ),
    )

    db.commit()

    safe_email(
        current_user,
        medicine,
        reminder_time,
    )

    safe_sms(
        current_user,
        medicine,
        reminder_time,
    )

    return {
        "success": True,
        "status": "Snoozed",
        "medicine_id": medicine.id,
        "medicine_name": medicine.medicine_name,
        "reminder_time": reminder_time,
        "message": "Reminder snoozed.",
    }


# ============================================================
# CURRENT REMINDERS
# ============================================================

@router.get("/current")
def current_reminders(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    medicines = (
        db.query(Medicine)
        .filter(
            Medicine.user_id == current_user.id,
            Medicine.is_active.is_(True),
        )
        .all()
    )

    return [
        {
            "id": medicine.id,
            "medicine_name":
                medicine.medicine_name,
            "dosage":
                medicine.dosage,
            "frequency":
                medicine.frequency,
            "reminder_time":
                medicine.reminder_time,
            "instructions":
                medicine.instructions,
            "remaining_quantity":
                medicine.remaining_quantity,
            "tablets_per_day":
                medicine.tablets_per_day,
        }
        for medicine in medicines
    ]


# ============================================================
# REMINDER HISTORY
# ============================================================

@router.get("/history")
def reminder_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    history = (
        db.query(ReminderHistory)
        .filter(
            ReminderHistory.user_id
            == current_user.id
        )
        .order_by(
            ReminderHistory.sent_at.desc()
        )
        .all()
    )

    return history


# ============================================================
# CLEAR HISTORY
# ============================================================

@router.delete("/history")
def clear_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    (
        db.query(ReminderHistory)
        .filter(
            ReminderHistory.user_id
            == current_user.id
        )
        .delete(
            synchronize_session=False
        )
    )

    db.commit()

    return {
        "success": True,
        "message":
            "History cleared successfully.",
    }