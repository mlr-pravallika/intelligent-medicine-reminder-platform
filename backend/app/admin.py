from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import require_role
from app.database import get_db
from app.models import (
    CaregiverPatientAssignment,
    Medicine,
    Notification,
    ReminderHistory,
    User,
)


router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)


# ============================================================
# ADMIN PROFILE
# ============================================================

@router.get("/profile")
def admin_profile(
    current_user: User = Depends(
        require_role("admin")
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
# ADMIN DASHBOARD SUMMARY
# ============================================================

@router.get("/summary")
def admin_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("admin")
    ),
):
    # --------------------------------------------------------
    # USERS
    # Admin accounts are intentionally excluded from
    # "Registered Users" on the dashboard.
    # --------------------------------------------------------

    patients = (
        db.query(func.count(User.id))
        .filter(User.role == "patient")
        .scalar()
        or 0
    )

    caregivers = (
        db.query(func.count(User.id))
        .filter(User.role == "caregiver")
        .scalar()
        or 0
    )

    admins = (
        db.query(func.count(User.id))
        .filter(User.role == "admin")
        .scalar()
        or 0
    )

    total_users = patients + caregivers

    # --------------------------------------------------------
    # MEDICINES
    # --------------------------------------------------------

    total_medicines = (
        db.query(func.count(Medicine.id))
        .scalar()
        or 0
    )

    active_medicines = (
        db.query(func.count(Medicine.id))
        .filter(
            Medicine.is_active.is_(True)
        )
        .scalar()
        or 0
    )

    # --------------------------------------------------------
    # NOTIFICATIONS
    # --------------------------------------------------------

    total_notifications = (
        db.query(func.count(Notification.id))
        .scalar()
        or 0
    )

    unread_notifications = (
        db.query(func.count(Notification.id))
        .filter(
            Notification.is_read.is_(False)
        )
        .scalar()
        or 0
    )

    # --------------------------------------------------------
    # REMINDERS
    # --------------------------------------------------------

    reminder_events = (
        db.query(func.count(ReminderHistory.id))
        .scalar()
        or 0
    )

    taken = (
        db.query(func.count(ReminderHistory.id))
        .filter(
            ReminderHistory.status == "Taken"
        )
        .scalar()
        or 0
    )

    missed = (
        db.query(func.count(ReminderHistory.id))
        .filter(
            ReminderHistory.status == "Missed"
        )
        .scalar()
        or 0
    )

    # --------------------------------------------------------
    # ADHERENCE
    # --------------------------------------------------------

    completed_reminders = taken + missed

    adherence = 0.0

    if completed_reminders > 0:
        adherence = round(
            (taken / completed_reminders) * 100,
            1,
        )

    # --------------------------------------------------------
    # CAREGIVER ASSIGNMENTS
    # --------------------------------------------------------

    caregiver_assignments = (
        db.query(
            func.count(
                CaregiverPatientAssignment.id
            )
        )
        .scalar()
        or 0
    )

    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {
        "total_users": total_users,
        "patients": patients,
        "caregivers": caregivers,
        "admins": admins,
        "medicines": total_medicines,
        "active_medicines": active_medicines,
        "notifications": total_notifications,
        "unread_notifications": unread_notifications,
        "reminder_events": reminder_events,
        "taken_reminders": taken,
        "missed_reminders": missed,
        "overall_adherence": adherence,
        "caregiver_assignments": caregiver_assignments,
    }


# ============================================================
# ALL USERS
# ============================================================

@router.get("/users")
def admin_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("admin")
    ),
):
    users = (
        db.query(User)
        .order_by(
            User.created_at.desc()
        )
        .all()
    )

    return [
        {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "created_at": user.created_at,
        }
        for user in users
    ]


# ============================================================
# ALL PATIENTS
# ============================================================

@router.get("/patients")
def admin_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("admin")
    ),
):
    patients = (
        db.query(User)
        .filter(
            User.role == "patient"
        )
        .order_by(
            User.name.asc()
        )
        .all()
    )

    return [
        {
            "id": patient.id,
            "name": patient.name,
            "email": patient.email,
            "phone": patient.phone,
            "created_at": patient.created_at,
        }
        for patient in patients
    ]


# ============================================================
# ALL CAREGIVERS
# ============================================================

@router.get("/caregivers")
def admin_caregivers(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("admin")
    ),
):
    caregivers = (
        db.query(User)
        .filter(
            User.role == "caregiver"
        )
        .order_by(
            User.name.asc()
        )
        .all()
    )

    return [
        {
            "id": caregiver.id,
            "name": caregiver.name,
            "email": caregiver.email,
            "phone": caregiver.phone,
            "created_at": caregiver.created_at,
        }
        for caregiver in caregivers
    ]


# ============================================================
# ASSIGN PATIENT TO CAREGIVER
# ============================================================

@router.post("/assign-caregiver")
def assign_caregiver(
    caregiver_id: int,
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("admin")
    ),
):
    # --------------------------------------------------------
    # Verify caregiver
    # --------------------------------------------------------

    caregiver = (
        db.query(User)
        .filter(
            User.id == caregiver_id,
            User.role == "caregiver",
        )
        .first()
    )

    if caregiver is None:
        raise HTTPException(
            status_code=404,
            detail="Caregiver not found.",
        )

    # --------------------------------------------------------
    # Verify patient
    # --------------------------------------------------------

    patient = (
        db.query(User)
        .filter(
            User.id == patient_id,
            User.role == "patient",
        )
        .first()
    )

    if patient is None:
        raise HTTPException(
            status_code=404,
            detail="Patient not found.",
        )

    # --------------------------------------------------------
    # Prevent duplicate assignment
    # --------------------------------------------------------

    existing = (
        db.query(
            CaregiverPatientAssignment
        )
        .filter(
            CaregiverPatientAssignment.caregiver_id
            == caregiver_id,
            CaregiverPatientAssignment.patient_id
            == patient_id,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail=(
                "Patient is already assigned "
                "to this caregiver."
            ),
        )

    # --------------------------------------------------------
    # Create assignment
    # --------------------------------------------------------

    assignment = (
        CaregiverPatientAssignment(
            caregiver_id=caregiver_id,
            patient_id=patient_id,
        )
    )

    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    return {
        "message": "Patient assigned successfully.",
        "assignment_id": assignment.id,
        "caregiver_id": caregiver_id,
        "patient_id": patient_id,
    }


# ============================================================
# ALL CAREGIVER-PATIENT ASSIGNMENTS
# ============================================================

@router.get("/assignments")
def admin_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("admin")
    ),
):
    assignments = (
        db.query(
            CaregiverPatientAssignment
        )
        .order_by(
            CaregiverPatientAssignment.assigned_at.desc()
        )
        .all()
    )

    result = []

    for assignment in assignments:

        caregiver = (
            db.query(User)
            .filter(
                User.id
                == assignment.caregiver_id
            )
            .first()
        )

        patient = (
            db.query(User)
            .filter(
                User.id
                == assignment.patient_id
            )
            .first()
        )

        if caregiver is None or patient is None:
            continue

        result.append(
            {
                "id": assignment.id,
                "caregiver_id": caregiver.id,
                "caregiver_name": caregiver.name,
                "patient_id": patient.id,
                "patient_name": patient.name,
                "assigned_at": assignment.assigned_at,
            }
        )

    return result


# ============================================================
# RECENT PLATFORM ACTIVITY
# ============================================================

@router.get("/activity")
def admin_activity(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("admin")
    ),
):
    recent_reminders = (
        db.query(ReminderHistory)
        .order_by(
            ReminderHistory.sent_at.desc()
        )
        .limit(10)
        .all()
    )

    return [
        {
            "type": "reminder",
            "id": item.id,
            "medicine_name": item.medicine_name,
            "status": item.status,
            "dosage": item.dosage,
            "reminder_time": item.reminder_time,
            "sent_at": item.sent_at,
            "user_id": item.user_id,
        }
        for item in recent_reminders
    ]


# ============================================================
# SYSTEM STATUS
# ============================================================

@router.get("/system")
def admin_system(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("admin")
    ),
):
    # Real database connectivity check.
    db.execute(
        func.now().select()
    )

    return {
        "api": "online",
        "database": "online",
        "scheduler": "running",
        "checked_at": datetime.now(
            timezone.utc
        ),
    }


# ============================================================
# PLATFORM ANALYTICS
# ============================================================

@router.get("/analytics")
def admin_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("admin")
    ),
):
    # --------------------------------------------------------
    # USERS
    # Admin accounts are excluded from registered-user count.
    # --------------------------------------------------------

    total_patients = (
        db.query(User)
        .filter(
            User.role == "patient"
        )
        .count()
    )

    total_caregivers = (
        db.query(User)
        .filter(
            User.role == "caregiver"
        )
        .count()
    )

    total_users = (
        total_patients +
        total_caregivers
    )

    # --------------------------------------------------------
    # MEDICINES
    # --------------------------------------------------------

    total_medicines = (
        db.query(Medicine)
        .count()
    )

    active_medicines = (
        db.query(Medicine)
        .filter(
            Medicine.is_active.is_(True)
        )
        .count()
    )

    # --------------------------------------------------------
    # REMINDER HISTORY
    # --------------------------------------------------------

    total_reminders = (
        db.query(ReminderHistory)
        .count()
    )

    taken = (
        db.query(ReminderHistory)
        .filter(
            ReminderHistory.status == "Taken"
        )
        .count()
    )

    missed = (
        db.query(ReminderHistory)
        .filter(
            ReminderHistory.status == "Missed"
        )
        .count()
    )

    snoozed = (
        db.query(ReminderHistory)
        .filter(
            ReminderHistory.status == "Snoozed"
        )
        .count()
    )

    completed_reminders = taken + missed

    adherence = 0.0

    if completed_reminders > 0:
        adherence = round(
            (taken / completed_reminders) * 100,
            1,
        )

    # --------------------------------------------------------
    # NOTIFICATIONS
    # --------------------------------------------------------

    total_notifications = (
        db.query(Notification)
        .count()
    )

    unread_notifications = (
        db.query(Notification)
        .filter(
            Notification.is_read.is_(False)
        )
        .count()
    )

    # --------------------------------------------------------
    # CAREGIVER ASSIGNMENTS
    # --------------------------------------------------------

    total_assignments = (
        db.query(
            CaregiverPatientAssignment
        )
        .count()
    )

    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {
        "users": {
            "total": total_users,
            "patients": total_patients,
            "caregivers": total_caregivers,
        },
        "medicines": {
            "total": total_medicines,
            "active": active_medicines,
        },
        "reminders": {
            "total": total_reminders,
            "taken": taken,
            "missed": missed,
            "snoozed": snoozed,
            "adherence": adherence,
        },
        "notifications": {
            "total": total_notifications,
            "unread": unread_notifications,
        },
        "assignments": {
            "total": total_assignments,
        },
    }