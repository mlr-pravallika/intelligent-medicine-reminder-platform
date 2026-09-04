from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
)

from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base


# ============================================================
# USER
# ============================================================

class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    name = Column(
        String,
        nullable=False,
    )

    email = Column(
        String,
        unique=True,
        nullable=False,
    )

    password_hash = Column(
        String,
        nullable=False,
    )

    role = Column(
        String,
        default="patient",
    )

    phone = Column(
        String,
        default="",
    )

    # -------------------------
    # Profile information
    # -------------------------

    dob = Column(
        String,
        default="",
    )

    gender = Column(
        String,
        default="",
    )

    blood_group = Column(
        String,
        default="",
    )

    height = Column(
        String,
        default="",
    )

    weight = Column(
        String,
        default="",
    )

    allergies = Column(
        String,
        default="",
    )

    medical_conditions = Column(
        String,
        default="",
    )

    preferred_language = Column(
        String,
        default="English",
    )

    address = Column(
        String,
        default="",
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    medicines = relationship(
        "Medicine",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    emergency_contacts = relationship(
        "EmergencyContact",
        cascade="all, delete-orphan",
    )

    doctors = relationship(
        "Doctor",
        cascade="all, delete-orphan",
    )

    insurance = relationship(
        "Insurance",
        cascade="all, delete-orphan",
    )

    caregiver_assignments = relationship(
        "CaregiverPatientAssignment",
        foreign_keys=(
            "CaregiverPatientAssignment.caregiver_id"
        ),
        back_populates="caregiver",
        cascade="all, delete-orphan",
    )

    patient_assignments = relationship(
        "CaregiverPatientAssignment",
        foreign_keys=(
            "CaregiverPatientAssignment.patient_id"
        ),
        back_populates="patient",
        cascade="all, delete-orphan",
    )


# ============================================================
# MEDICINE
# ============================================================

class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    medicine_name = Column(
        String,
        nullable=False,
    )

    dosage = Column(
        String,
        nullable=False,
    )

    frequency = Column(
        String,
        nullable=False,
    )

    # Multiple reminder times are stored as:
    # "09:00,21:00"
    #
    # Maximum three times for this milestone.
    reminder_time = Column(
        String,
        nullable=False,
    )

    start_date = Column(
        String,
    )

    end_date = Column(
        String,
    )

    instructions = Column(
        String,
    )

    total_quantity = Column(
        Integer,
        default=30,
    )

    remaining_quantity = Column(
        Integer,
        default=30,
    )

    tablets_per_day = Column(
        Integer,
        default=1,
    )

    low_stock_threshold = Column(
        Integer,
        default=5,
        nullable=False,
    )

    is_active = Column(
        Boolean,
        default=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    user = relationship(
        "User",
        back_populates="medicines",
    )


# ============================================================
# REMINDER HISTORY
# ============================================================

class ReminderHistory(Base):
    __tablename__ = "reminder_history"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        index=True,
    )

    medicine_name = Column(
        String,
    )

    dosage = Column(
        String,
    )

    # Stores the specific triggered time.
    # Example: "09:00"
    reminder_time = Column(
        String,
    )

    status = Column(
        String,
    )

    sent_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )


# ============================================================
# NOTIFICATIONS
# ============================================================

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        index=True,
    )

    title = Column(
        String,
        nullable=False,
    )

    message = Column(
        String,
        nullable=False,
    )

    notification_type = Column(
        String,
    )

    channel = Column(
        String,
    )

    is_read = Column(
        Boolean,
        default=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )


# ============================================================
# EMERGENCY CONTACT
# ============================================================

class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
    )

    name = Column(
        String,
        nullable=False,
    )

    relation = Column(
        String,
        nullable=False,
    )

    phone = Column(
        String,
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )


# ============================================================
# DOCTOR
# ============================================================

class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
    )

    doctor_name = Column(
        String,
        nullable=False,
    )

    specialization = Column(
        String,
    )

    hospital = Column(
        String,
    )

    phone = Column(
        String,
    )

    email = Column(
        String,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )


# ============================================================
# INSURANCE
# ============================================================

class Insurance(Base):
    __tablename__ = "insurance"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
    )

    provider = Column(
        String,
    )

    policy_number = Column(
        String,
    )

    member_id = Column(
        String,
    )

    expiry_date = Column(
        String,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )


# ============================================================
# CAREGIVER-PATIENT ASSIGNMENT
# ============================================================

class CaregiverPatientAssignment(Base):
    __tablename__ = "caregiver_patient_assignments"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    caregiver_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    patient_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    assigned_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    caregiver = relationship(
        "User",
        foreign_keys=[caregiver_id],
        back_populates="caregiver_assignments",
    )

    patient = relationship(
        "User",
        foreign_keys=[patient_id],
        back_populates="patient_assignments",
    )


# ============================================================
# PASSWORD RESET
# ============================================================

class PasswordResetCode(Base):
    __tablename__ = "password_reset_codes"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    code_hash = Column(
        String,
        nullable=False,
    )

    expires_at = Column(
        DateTime(timezone=True),
        nullable=False,
    )

    attempts = Column(
        Integer,
        default=0,
        nullable=False,
    )

    used = Column(
        Boolean,
        default=False,
        nullable=False,
    )

    verified = Column(
        Boolean,
        default=False,
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    user = relationship(
        "User",
        foreign_keys=[user_id],
    )