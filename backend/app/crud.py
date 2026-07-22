from sqlalchemy.orm import Session

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
        user_id
    )

    if not db_medicine:
        return None

    db.delete(db_medicine)
    db.commit()

    return True