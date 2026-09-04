from datetime import datetime
import re

from pydantic import BaseModel, EmailStr, field_validator


# ============================================================
# AUTHENTICATION
# ============================================================

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str
    phone: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


# ============================================================
# PROFILE
# ============================================================

class ProfileUpdate(BaseModel):
    name: str
    phone: str | None = None
    dob: str | None = None
    gender: str | None = None
    blood_group: str | None = None
    height: str | None = None
    weight: str | None = None
    allergies: str | None = None
    medical_conditions: str | None = None
    preferred_language: str | None = None
    address: str | None = None


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    phone: str
    dob: str | None = None
    gender: str | None = None
    blood_group: str | None = None
    height: str | None = None
    weight: str | None = None
    allergies: str | None = None
    medical_conditions: str | None = None
    preferred_language: str | None = None
    address: str | None = None

    class Config:
        from_attributes = True


# ============================================================
# MEDICINE HELPERS
# ============================================================

def expected_reminder_count(frequency: str) -> int:
    normalized = (frequency or "").strip().lower()

    if "once daily" in normalized:
        return 1
    if "twice daily" in normalized:
        return 2
    if "three times daily" in normalized:
        return 3
    if "every other day" in normalized:
        return 1
    if "weekly" in normalized:
        return 1
    if "as needed" in normalized:
        return 1

    return 1


def validate_reminder_times(
    value: str,
    frequency: str,
) -> str:
    if not value or not value.strip():
        raise ValueError(
            "At least one reminder time is required."
        )

    times = [
        item.strip()
        for item in value.split(",")
        if item.strip()
    ]

    if len(times) > 3:
        raise ValueError(
            "A medicine can have a maximum of 3 reminder times."
        )

    seen: set[str] = set()

    for time_value in times:
        if not re.fullmatch(
            r"(?:[01]\d|2[0-3]):[0-5]\d",
            time_value,
        ):
            raise ValueError(
                f"Invalid reminder time: {time_value}. Use HH:MM format."
            )

        if time_value in seen:
            raise ValueError(
                "Reminder times must be unique."
            )

        seen.add(time_value)

    expected = expected_reminder_count(frequency)

    if len(times) != expected:
        raise ValueError(
            f"{frequency} requires {expected} reminder time(s), "
            f"but {len(times)} were provided."
        )

    return ",".join(times)


# ============================================================
# MEDICINE
# ============================================================

class MedicineCreate(BaseModel):
    medicine_name: str
    dosage: str
    frequency: str
    reminder_time: str
    start_date: str
    end_date: str
    total_quantity: int
    remaining_quantity: int
    tablets_per_day: int
    low_stock_threshold: int = 5
    instructions: str | None = None

    @field_validator("medicine_name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 2:
            raise ValueError(
                "Medicine name must contain at least 2 characters."
            )
        return value

    @field_validator("dosage")
    @classmethod
    def validate_dosage(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Dosage is required.")
        return value

    @field_validator("reminder_time")
    @classmethod
    def validate_times(cls, value: str, info) -> str:
        frequency = info.data.get("frequency", "")
        return validate_reminder_times(value, frequency)

    @field_validator(
        "total_quantity",
        "remaining_quantity",
        "tablets_per_day",
        "low_stock_threshold",
    )
    @classmethod
    def validate_non_negative(cls, value: int) -> int:
        if value < 0:
            raise ValueError(
                "Quantity values cannot be negative."
            )
        return value


class MedicineUpdate(BaseModel):
    medicine_name: str
    dosage: str
    frequency: str
    reminder_time: str
    start_date: str
    end_date: str
    instructions: str | None = None
    total_quantity: int
    remaining_quantity: int
    tablets_per_day: int
    low_stock_threshold: int = 5
    is_active: bool = True

    @field_validator("medicine_name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 2:
            raise ValueError(
                "Medicine name must contain at least 2 characters."
            )
        return value

    @field_validator("dosage")
    @classmethod
    def validate_dosage(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Dosage is required.")
        return value

    @field_validator("reminder_time")
    @classmethod
    def validate_times(cls, value: str, info) -> str:
        frequency = info.data.get("frequency", "")
        return validate_reminder_times(value, frequency)

    @field_validator(
        "total_quantity",
        "remaining_quantity",
        "tablets_per_day",
        "low_stock_threshold",
    )
    @classmethod
    def validate_non_negative(cls, value: int) -> int:
        if value < 0:
            raise ValueError(
                "Quantity values cannot be negative."
            )
        return value


class MedicineResponse(BaseModel):
    id: int
    medicine_name: str
    dosage: str
    frequency: str
    reminder_time: str
    start_date: str
    end_date: str
    instructions: str | None = None
    total_quantity: int
    remaining_quantity: int
    tablets_per_day: int
    low_stock_threshold: int
    is_active: bool

    class Config:
        from_attributes = True


# ============================================================
# MEDICINE VALIDATION
# ============================================================

class MedicineNameValidationRequest(BaseModel):
    medicine_name: str


class MedicineNameValidationResponse(BaseModel):
    valid: bool
    medicine_name: str
    message: str
    suggestion: str | None = None
    available: bool = True


# ============================================================
# REMINDER HISTORY
# ============================================================

class ReminderHistoryResponse(BaseModel):
    id: int
    medicine_name: str
    dosage: str
    reminder_time: str
    sent_at: datetime
    status: str

    class Config:
        from_attributes = True


# ============================================================
# NOTIFICATIONS
# ============================================================

class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    notification_type: str
    channel: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# AI
# ============================================================

class ChatRequest(BaseModel):
    message: str


class AssistantRequest(BaseModel):
    question: str


class AssistantResponse(BaseModel):
    answer: str


# ============================================================
# GOOGLE
# ============================================================

class GoogleLogin(BaseModel):
    credential: str


# ============================================================
# PASSWORD RESET
# ============================================================

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class VerifyResetCodeRequest(BaseModel):
    email: EmailStr
    code: str


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str
