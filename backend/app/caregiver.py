from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import require_role
from app.models import (
    User,
    Medicine,
    ReminderHistory,
    Notification,
    CaregiverPatientAssignment,
)
from app.email_service import send_email
from app.sms_service import send_sms


router = APIRouter(
    prefix="/caregiver",
    tags=["Caregiver"],
)


# ============================================================
# HELPERS
# ============================================================

def get_assigned_patient(
    db: Session,
    caregiver_id: int,
    patient_id: int,
):
    assignment = (
        db.query(CaregiverPatientAssignment)
        .filter(
            CaregiverPatientAssignment.caregiver_id == caregiver_id,
            CaregiverPatientAssignment.patient_id == patient_id,
        )
        .first()
    )

    if not assignment:
        raise HTTPException(
            status_code=403,
            detail="This patient is not assigned to you.",
        )

    patient = (
        db.query(User)
        .filter(
            User.id == patient_id,
            User.role == "patient",
        )
        .first()
    )

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found.",
        )

    return patient


def get_patient_adherence(
    db: Session,
    patient_id: int,
):
    histories = (
        db.query(ReminderHistory)
        .filter(
            ReminderHistory.user_id == patient_id
        )
        .all()
    )

    total = len(histories)

    taken = sum(
        1 for item in histories
        if item.status.lower() == "taken"
    )

    missed = sum(
        1 for item in histories
        if item.status.lower() == "missed"
    )

    if total == 0:
        adherence = 0.0
    else:
        adherence = round(
            (taken / total) * 100,
            1
        )

    return {
        "total": total,
        "taken": taken,
        "missed": missed,
        "adherence": adherence,
    }


def get_today_missed(
    db: Session,
    patient_id: int,
):
    today = datetime.now(
        timezone.utc
    ).date()

    histories = (
        db.query(ReminderHistory)
        .filter(
            ReminderHistory.user_id == patient_id
        )
        .all()
    )

    count = 0

    for item in histories:

        if not item.sent_at:
            continue

        item_date = item.sent_at.date()

        if (
            item_date == today
            and item.status.lower() == "missed"
        ):
            count += 1

    return count


def get_patient_alerts(
    db: Session,
    patient_id: int,
):
    alerts = []

    # --------------------------------------------------------
    # Unread patient notifications
    # --------------------------------------------------------

    notifications = (
        db.query(Notification)
        .filter(
            Notification.user_id == patient_id,
            Notification.is_read == False,
        )
        .order_by(
            Notification.created_at.desc()
        )
        .limit(10)
        .all()
    )

    for item in notifications:
        alerts.append({
            "id": item.id,
            "type": "notification",
            "severity": "medium",
            "title": item.title,
            "message": item.message,
            "created_at": item.created_at,
        })

    # --------------------------------------------------------
    # Low medicine quantity
    # --------------------------------------------------------

    medicines = (
        db.query(Medicine)
        .filter(
            Medicine.user_id == patient_id,
            Medicine.is_active == True,
        )
        .all()
    )

    for medicine in medicines:

        if (
            medicine.remaining_quantity is not None
            and medicine.remaining_quantity <= 5
        ):
            alerts.append({
                "id": medicine.id,
                "type": "refill",
                "severity": "high",
                "title": "Medicine refill needed",
                "message": (
                    f"{medicine.medicine_name} has only "
                    f"{medicine.remaining_quantity} tablets remaining."
                ),
                "created_at": medicine.created_at,
            })

    # --------------------------------------------------------
    # Missed doses today
    # --------------------------------------------------------

    missed_today = get_today_missed(
        db,
        patient_id
    )

    if missed_today > 0:

        alerts.append({
            "id": f"missed-{patient_id}",
            "type": "missed_dose",
            "severity": "high",
            "title": "Missed doses today",
            "message": (
                f"The patient missed {missed_today} "
                f"dose(s) today."
            ),
            "created_at": datetime.now(
                timezone.utc
            ),
        })

    return alerts


# ============================================================
# PROFILE
# ============================================================

@router.get("/profile")
def caregiver_profile(
    current_user: User = Depends(
        require_role("caregiver")
    ),
):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "phone": current_user.phone,
        "role": current_user.role,
    }


# ============================================================
# ALL ASSIGNED PATIENTS
# ============================================================

@router.get("/patients")
def caregiver_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("caregiver")
    ),
):
    assignments = (
        db.query(CaregiverPatientAssignment)
        .filter(
            CaregiverPatientAssignment.caregiver_id
            == current_user.id
        )
        .order_by(
            CaregiverPatientAssignment.assigned_at.desc()
        )
        .all()
    )

    result = []

    for assignment in assignments:

        patient = (
            db.query(User)
            .filter(
                User.id == assignment.patient_id,
                User.role == "patient",
            )
            .first()
        )

        if not patient:
            continue

        adherence = get_patient_adherence(
            db,
            patient.id
        )

        missed_today = get_today_missed(
            db,
            patient.id
        )

        alerts = get_patient_alerts(
            db,
            patient.id
        )

        medicines = (
            db.query(Medicine)
            .filter(
                Medicine.user_id == patient.id,
                Medicine.is_active == True,
            )
            .all()
        )

        result.append({
            "id": patient.id,
            "name": patient.name,
            "email": patient.email,
            "phone": patient.phone,

            "dob": patient.dob,
            "gender": patient.gender,
            "blood_group": patient.blood_group,
            "height": patient.height,
            "weight": patient.weight,
            "allergies": patient.allergies,
            "medical_conditions": patient.medical_conditions,
            "preferred_language": patient.preferred_language,
            "address": patient.address,

            "assigned_at": assignment.assigned_at,

            "medicine_count": len(medicines),

            "adherence": adherence["adherence"],
            "total_reminders": adherence["total"],
            "taken": adherence["taken"],
            "missed": adherence["missed"],

            "missed_today": missed_today,

            "critical_alerts": len([
                item
                for item in alerts
                if item["severity"] == "high"
            ]),

            "alerts": alerts[:5],
        })

    return result


# ============================================================
# PATIENT MEDICINES
# ============================================================

@router.get("/patients/{patient_id}/medicines")
def caregiver_patient_medicines(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("caregiver")
    ),
):
    get_assigned_patient(
        db,
        current_user.id,
        patient_id,
    )

    medicines = (
        db.query(Medicine)
        .filter(
            Medicine.user_id == patient_id,
            Medicine.is_active == True,
        )
        .order_by(
            Medicine.reminder_time.asc()
        )
        .all()
    )

    return [
        {
            "id": medicine.id,
            "medicine_name": medicine.medicine_name,
            "dosage": medicine.dosage,
            "frequency": medicine.frequency,
            "reminder_time": medicine.reminder_time,
            "start_date": medicine.start_date,
            "end_date": medicine.end_date,
            "instructions": medicine.instructions,
            "total_quantity": medicine.total_quantity,
            "remaining_quantity": medicine.remaining_quantity,
            "tablets_per_day": medicine.tablets_per_day,
            "is_active": medicine.is_active,
        }
        for medicine in medicines
    ]


# ============================================================
# PATIENT ADHERENCE
# ============================================================

@router.get("/patients/{patient_id}/adherence")
def caregiver_patient_adherence(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("caregiver")
    ),
):
    get_assigned_patient(
        db,
        current_user.id,
        patient_id,
    )

    summary = get_patient_adherence(
        db,
        patient_id
    )

    histories = (
        db.query(ReminderHistory)
        .filter(
            ReminderHistory.user_id == patient_id
        )
        .order_by(
            ReminderHistory.sent_at.desc()
        )
        .limit(50)
        .all()
    )

    return {
        "summary": summary,
        "history": [
            {
                "id": item.id,
                "medicine_name": item.medicine_name,
                "dosage": item.dosage,
                "reminder_time": item.reminder_time,
                "status": item.status,
                "sent_at": item.sent_at,
            }
            for item in histories
        ],
    }


# ============================================================
# PATIENT ALERTS
# ============================================================

@router.get("/patients/{patient_id}/alerts")
def caregiver_patient_alerts(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("caregiver")
    ),
):
    get_assigned_patient(
        db,
        current_user.id,
        patient_id,
    )

    return get_patient_alerts(
        db,
        patient_id
    )


# ============================================================
# SEND MEDICINE REMINDER TO PATIENT
# ============================================================

@router.post(
    "/patients/{patient_id}/medicines/{medicine_id}/remind"
)
def caregiver_send_reminder(
    patient_id: int,
    medicine_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("caregiver")
    ),
):
    patient = get_assigned_patient(
        db,
        current_user.id,
        patient_id,
    )

    medicine = (
        db.query(Medicine)
        .filter(
            Medicine.id == medicine_id,
            Medicine.user_id == patient_id,
            Medicine.is_active == True,
        )
        .first()
    )

    if not medicine:
        raise HTTPException(
            status_code=404,
            detail="Medicine not found.",
        )

    # --------------------------------------------------------
    # In-app notification
    # --------------------------------------------------------

    notification = Notification(
        user_id=patient.id,
        title="Caregiver Reminder",
        message=(
            f"{current_user.name} reminded you to take "
            f"{medicine.medicine_name} ({medicine.dosage})."
        ),
        notification_type="CaregiverReminder",
        channel="App",
        is_read=False,
    )

    db.add(notification)
    db.commit()

    # --------------------------------------------------------
    # Email
    # --------------------------------------------------------

    try:
        send_email(
            receiver_email=patient.email,
            medicine_name=medicine.medicine_name,
            dosage=medicine.dosage,
            reminder_time=medicine.reminder_time,
        )
    except Exception as error:
        print(
            "Caregiver reminder email failed:",
            error
        )

    # --------------------------------------------------------
    # SMS
    # --------------------------------------------------------

    try:
        send_sms(
            patient.phone,
            patient.name,
            medicine.medicine_name,
            medicine.dosage,
            medicine.reminder_time,
        )
    except Exception as error:
        print(
            "Caregiver reminder SMS failed:",
            error
        )

    return {
        "message": (
            f"Reminder sent to {patient.name}"
        ),
        "patient_id": patient.id,
        "medicine_id": medicine.id,
    }


# ============================================================
# CAREGIVER DASHBOARD SUMMARY
# ============================================================

@router.get("/summary")
def caregiver_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("caregiver")
    ),
):
    patients = caregiver_patients(
        db=db,
        current_user=current_user,
    )

    patient_count = len(patients)

    if patient_count == 0:
        return {
            "assigned_patients": 0,
            "average_adherence": 0,
            "missed_today": 0,
            "critical_alerts": 0,
        }

    average_adherence = round(
        sum(
            float(
                patient["adherence"]
            )
            for patient in patients
        )
        / patient_count,
        1,
    )

    missed_today = sum(
        patient["missed_today"]
        for patient in patients
    )

    critical_alerts = sum(
        patient["critical_alerts"]
        for patient in patients
    )

    return {
        "assigned_patients": patient_count,
        "average_adherence": average_adherence,
        "missed_today": missed_today,
        "critical_alerts": critical_alerts,
    }