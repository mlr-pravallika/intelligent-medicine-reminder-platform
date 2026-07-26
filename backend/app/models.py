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
    name = Column(String)
    email = Column(String)
    password_hash = Column(String)
    role = Column(String)
    phone = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    medicines = relationship(
        "Medicine",
        back_populates="user"
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