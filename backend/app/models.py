from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Boolean,
    ForeignKey,
)

from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False)

    email = Column(String, unique=True, nullable=False)

    password_hash = Column(String, nullable=False)

    role = Column(String, default="patient")

    phone = Column(String, default="")

    # -------------------------
    # Profile Information
    # -------------------------

    dob = Column(String, default="")

    gender = Column(String, default="")

    blood_group = Column(String, default="")

    height = Column(String, default="")

    weight = Column(String, default="")

    allergies = Column(String, default="")

    medical_conditions = Column(String, default="")

    preferred_language = Column(String, default="English")

    address = Column(String, default="")

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    medicines = relationship(
        "Medicine",
        back_populates="user"
    )

    emergency_contacts = relationship(
        "EmergencyContact",
        cascade="all, delete-orphan"
    )

    doctors = relationship(
        "Doctor",
        cascade="all, delete-orphan"
    )

    insurance = relationship(
        "Insurance",
        cascade="all, delete-orphan"
    ) 

class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id")
    )

    medicine_name = Column(String, nullable=False)

    dosage = Column(String, nullable=False)

    frequency = Column(String, nullable=False)

    reminder_time = Column(String, nullable=False)

    start_date = Column(String)

    end_date = Column(String)

    instructions = Column(String)

    total_quantity = Column(Integer, default=30)

    remaining_quantity = Column(Integer, default=30)

    tablets_per_day = Column(Integer, default=1)

    is_active = Column(Boolean, default=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    user = relationship(
        "User",
        back_populates="medicines"
    )

class ReminderHistory(Base):
    __tablename__ = "reminder_history"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id")
    )

    medicine_name = Column(String)

    dosage = Column(String)

    reminder_time = Column(String)

    status = Column(String)

    sent_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )    

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id")
    )

    title = Column(String, nullable=False)

    message = Column(String, nullable=False)

    notification_type = Column(String)

    channel = Column(String)

    is_read = Column(Boolean, default=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )  

class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id")
    )

    name = Column(String, nullable=False)

    relation = Column(String, nullable=False)

    phone = Column(String, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    ) 

class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id")
    )

    doctor_name = Column(String, nullable=False)

    specialization = Column(String)

    hospital = Column(String)

    phone = Column(String)

    email = Column(String)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )  

class Insurance(Base):
    __tablename__ = "insurance"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id")
    )

    provider = Column(String)

    policy_number = Column(String)

    member_id = Column(String)

    expiry_date = Column(String)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )   