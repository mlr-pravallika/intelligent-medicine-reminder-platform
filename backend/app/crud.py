from sqlalchemy.orm import Session

from . import models, schemas


# ============================================================
# MEDICINES
# ============================================================

def create_medicine(
    db: Session,
    medicine: schemas.MedicineCreate,
    user_id: int,
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
        total_quantity=medicine.total_quantity,
        remaining_quantity=medicine.remaining_quantity,
        tablets_per_day=medicine.tablets_per_day,
        low_stock_threshold=medicine.low_stock_threshold,
        is_active=True,
    )

    db.add(db_medicine)
    db.commit()
    db.refresh(db_medicine)

    return db_medicine


def get_medicines(
    db: Session,
    user_id: int,
):
    return (
        db.query(models.Medicine)
        .filter(
            models.Medicine.user_id == user_id
        )
        .order_by(
            models.Medicine.created_at.desc()
        )
        .all()
    )


def get_medicine(
    db: Session,
    medicine_id: int,
    user_id: int,
):
    return (
        db.query(models.Medicine)
        .filter(
            models.Medicine.id == medicine_id,
            models.Medicine.user_id == user_id,
        )
        .first()
    )


def update_medicine(
    db: Session,
    medicine_id: int,
    user_id: int,
    medicine: schemas.MedicineUpdate,
):
    db_medicine = get_medicine(
        db,
        medicine_id,
        user_id,
    )

    if db_medicine is None:
        return None

    db_medicine.medicine_name = (
        medicine.medicine_name
    )

    db_medicine.dosage = (
        medicine.dosage
    )

    db_medicine.frequency = (
        medicine.frequency
    )

    db_medicine.reminder_time = (
        medicine.reminder_time
    )

    db_medicine.start_date = (
        medicine.start_date
    )

    db_medicine.end_date = (
        medicine.end_date
    )

    db_medicine.instructions = (
        medicine.instructions
    )

    db_medicine.total_quantity = (
        medicine.total_quantity
    )

    db_medicine.remaining_quantity = (
        medicine.remaining_quantity
    )

    db_medicine.tablets_per_day = (
        medicine.tablets_per_day
    )

    db_medicine.low_stock_threshold = (
        medicine.low_stock_threshold
    )

    db_medicine.is_active = (
        medicine.is_active
    )

    db.commit()
    db.refresh(db_medicine)

    return db_medicine


def delete_medicine(
    db: Session,
    medicine_id: int,
    user_id: int,
):
    db_medicine = get_medicine(
        db,
        medicine_id,
        user_id,
    )

    if db_medicine is None:
        return None

    db.delete(db_medicine)
    db.commit()

    return True


def get_refill_count(
    db: Session,
    user_id: int,
):
    medicines = (
        db.query(models.Medicine)
        .filter(
            models.Medicine.user_id == user_id
        )
        .all()
    )

    return sum(
        1
        for medicine in medicines
        if (
            medicine.remaining_quantity
            is not None
            and medicine.remaining_quantity <= 5
        )
    )


# ============================================================
# NOTIFICATIONS
# ============================================================

def get_notifications(
    db: Session,
    user_id: int,
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
    user_id: int,
):
    notification = (
        db.query(models.Notification)
        .filter(
            models.Notification.id
            == notification_id,
            models.Notification.user_id
            == user_id,
        )
        .first()
    )

    if notification is None:
        return None

    notification.is_read = True

    db.commit()
    db.refresh(notification)

    return notification


def mark_all_notifications_read(
    db: Session,
    user_id: int,
):
    notifications = (
        db.query(models.Notification)
        .filter(
            models.Notification.user_id
            == user_id,
            models.Notification.is_read.is_(False),
        )
        .all()
    )

    for notification in notifications:
        notification.is_read = True

    db.commit()

    return {
        "message": "All notifications marked as read"
    }