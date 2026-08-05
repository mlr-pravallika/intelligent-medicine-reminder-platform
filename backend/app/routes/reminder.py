from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Medicine, ReminderHistory
from app.auth import get_current_user
from app.models import User
from app.email_service import send_email
from app.sms_service import send_sms
from app.models import Notification

router = APIRouter(prefix="/reminders", tags=["Reminders"])


@router.post("/{medicine_id}/taken")
def mark_taken(
    medicine_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    medicine = (
        db.query(Medicine)
        .filter(
            Medicine.id == medicine_id,
            Medicine.user_id == current_user.id
        )
        .first()
    )

    if not medicine:
        return {"message": "Medicine not found"}

    medicine.remaining_quantity -= medicine.tablets_per_day

    history = ReminderHistory(
        user_id=current_user.id,
        medicine_name=medicine.medicine_name,
        dosage=medicine.dosage,
        reminder_time=medicine.reminder_time,
        status="Taken"
    )

    db.add(history)

    notification = Notification(
        user_id=current_user.id,
        title="Medicine Taken",
        message=f"You have taken {medicine.medicine_name} ({medicine.dosage}).",
        notification_type="Reminder",
        channel="App",
        is_read=False
    )

    db.add(notification)
    db.commit()

    print("Sending reminder email...")

    print("Current User ID:", current_user.id)
    print("Current User Email:", current_user.email)

    send_email(
        receiver_email=current_user.email,
        medicine_name=medicine.medicine_name,
        dosage=medicine.dosage,
        reminder_time=medicine.reminder_time,
    )

    print("Current User Phone:", current_user.phone)

    send_sms(
        current_user.phone,
        current_user.name,
        medicine.medicine_name,
        medicine.dosage,
        medicine.reminder_time
    )

    print("send_email() finished")

    return {"message": "Dose marked as taken"}

@router.post("/{medicine_id}/missed")
def mark_missed(
    medicine_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    medicine = (
        db.query(Medicine)
        .filter(
            Medicine.id == medicine_id,
            Medicine.user_id == current_user.id
        )
        .first()
    )

    if not medicine:
        return {"message": "Medicine not found"}

    history = ReminderHistory(
        user_id=current_user.id,
        medicine_name=medicine.medicine_name,
        dosage=medicine.dosage,
        reminder_time=medicine.reminder_time,
        status="Missed"
    )

    db.add(history)

    notification = Notification(
        user_id=current_user.id,
        title="Medicine Missed",
        message=f"You missed {medicine.medicine_name} ({medicine.dosage}).",
        notification_type="Reminder",
        channel="App",
        is_read=False
    )

    db.add(notification)
    db.commit()

    print("Sending reminder email...")

    send_email(
        receiver_email=current_user.email,
        medicine_name=medicine.medicine_name,
        dosage=medicine.dosage,
        reminder_time=medicine.reminder_time,
    )

    print("Current User Phone:", current_user.phone)

    send_sms(
        current_user.phone,
        current_user.name,
        medicine.medicine_name,
        medicine.dosage,
        medicine.reminder_time
    )

    print("send_email() finished")

    return {"message": "Dose marked as missed"}

@router.post("/{medicine_id}/snooze")
def snooze_reminder(

    medicine_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user)

):

    medicine = (
        db.query(Medicine)
        .filter(
            Medicine.id == medicine_id,
            Medicine.user_id == current_user.id
        )
        .first()
    )

    if not medicine:
        return {"message": "Medicine not found"}

    history = ReminderHistory(

        user_id=current_user.id,

        medicine_name=medicine.medicine_name,

        dosage=medicine.dosage,

        reminder_time=medicine.reminder_time,

        status="Snoozed"

    )

    db.add(history)

    notification = Notification(
        user_id=current_user.id,
        title="Reminder Snoozed",
        message=f"{medicine.medicine_name} reminder snoozed.",
        notification_type="Reminder",
        channel="App",
        is_read=False
    )

    db.add(notification)

    db.commit()

    print("Sending reminder email...")

    send_email(
        receiver_email=current_user.email,
        medicine_name=medicine.medicine_name,
        dosage=medicine.dosage,
        reminder_time=medicine.reminder_time,
    )

    print("Current User Phone:", current_user.phone)

    send_sms(
        current_user.phone,
        current_user.name,
        medicine.medicine_name,
        medicine.dosage,
        medicine.reminder_time
    )

    print("send_email() finished")

    return {

        "message": "Reminder Snoozed"

    }


@router.get("/current")
def current_reminders(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    medicines = (
        db.query(Medicine)
        .filter(
            Medicine.user_id == current_user.id,
            Medicine.is_active == True
        )
        .all()
    )

    return [

        {

            "id": m.id,

            "medicine_name": m.medicine_name,

            "dosage": m.dosage,

            "frequency": m.frequency,

            "reminder_time": m.reminder_time,

            "instructions": m.instructions,

            "remaining_quantity": m.remaining_quantity,

            "tablets_per_day": m.tablets_per_day,

        }

        for m in medicines

    ]

@router.get("/history")
def reminder_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    history = (
        db.query(ReminderHistory)
        .filter(
            ReminderHistory.user_id == current_user.id
        )
        .order_by(ReminderHistory.sent_at.desc())
        .all()
    )

    return history

@router.delete("/history")
def clear_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    db.query(ReminderHistory).filter(
        ReminderHistory.user_id == current_user.id
    ).delete()

    db.commit()

    return {
        "message": "History cleared successfully"
    }