from sqlalchemy.orm import Session
from datetime import datetime
from . import models, schemas


# -----------------------------
# Create Medicine
# -----------------------------
def create_medicine(
    db: Session,
    medicine: schemas.MedicineCreate,
    user_id: int
):
    db_medicine = models.Medicine(
        user_id=user_id,
        medicine_name=medicine.medicine_name,
        dosage=medicine.dosage,
        frequency=medicine.frequency,
        reminder_time=medicine.reminder_time,
        start_date=medicine.start_date,
        end_date=medicine.end_date,
        instructions=medicine.instructions,

        # Refill Prediction Fields
        total_quantity=medicine.total_quantity,
        remaining_quantity=medicine.remaining_quantity,
        tablets_per_day=medicine.tablets_per_day,
    )

    db.add(db_medicine)
    db.commit()
    db.refresh(db_medicine)

    return db_medicine


# -----------------------------
# Get All Medicines
# -----------------------------
def get_medicines(
    db: Session,
    user_id: int
):
    return (
        db.query(models.Medicine)
        .filter(models.Medicine.user_id == user_id)
        .order_by(models.Medicine.created_at.desc())
        .all()
    )


# -----------------------------
# Get Single Medicine
# -----------------------------
def get_medicine(
    db: Session,
    medicine_id: int,
    user_id: int
):
    return (
        db.query(models.Medicine)
        .filter(
            models.Medicine.id == medicine_id,
            models.Medicine.user_id == user_id
        )
        .first()
    )


# -----------------------------
# Update Medicine
# -----------------------------
def update_medicine(
    db: Session,
    medicine_id: int,
    user_id: int,
    medicine: schemas.MedicineUpdate
):

    db_medicine = get_medicine(
        db,
        medicine_id,
        user_id
    )

    if not db_medicine:
        return None

    db_medicine.medicine_name = medicine.medicine_name
    db_medicine.dosage = medicine.dosage
    db_medicine.frequency = medicine.frequency
    db_medicine.reminder_time = medicine.reminder_time
    db_medicine.start_date = medicine.start_date
    db_medicine.end_date = medicine.end_date
    db_medicine.instructions = medicine.instructions
    db_medicine.is_active = medicine.is_active

    # -----------------------------
    # Refill Prediction Fields
    # -----------------------------
    db_medicine.total_quantity = medicine.total_quantity
    db_medicine.remaining_quantity = medicine.remaining_quantity
    db_medicine.tablets_per_day = medicine.tablets_per_day

    db.commit()
    db.refresh(db_medicine)

    return db_medicine


# -----------------------------
# Delete Medicine
# -----------------------------
def delete_medicine(
    db: Session,
    medicine_id: int,
    user_id: int
):

    db_medicine = get_medicine(
        db,
        medicine_id,
        user_id,
    )

    if not db_medicine:
        return None

    db.delete(db_medicine)
    db.commit()

    return True

def get_refill_count(db, user_id):

    medicines = (
        db.query(models.Medicine)
        .filter(models.Medicine.user_id == user_id)
        .all()
    )

    count = 0

    for medicine in medicines:

        if medicine.remaining_quantity <= 5:

            count += 1

    return count

# -----------------------------
# Notifications
# -----------------------------

def get_notifications(
    db: Session,
    user_id: int
):

    return (
        db.query(models.Notification)
        .filter(
            models.Notification.user_id == user_id
        )
        .order_by(
            models.Notification.created_at.desc()
        )
        .all()
    )


def mark_notification_read(
    db: Session,
    notification_id: int,
    user_id: int
):

    notification = (
        db.query(models.Notification)
        .filter(
            models.Notification.id == notification_id,
            models.Notification.user_id == user_id
        )
        .first()
    )

    if notification:

        notification.is_read = True

        db.commit()

        db.refresh(notification)

    return notification


def mark_all_notifications_read(
    db: Session,
    user_id: int
):
    notifications = (
        db.query(models.Notification)
        .filter(
            models.Notification.user_id == user_id,
            models.Notification.is_read == False
        )
        .all()
    )

    for notification in notifications:
        notification.is_read = True

    db.commit()

    return {
        "message": "All notifications marked as read"
    }