from pydantic import BaseModel, EmailStr
from datetime import datetime

from sqlalchemy import Column, DateTime, func

class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    role: str
    phone: str


class UserLogin(BaseModel):
    email: str
    password: str


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


class MedicineCreate(BaseModel):
    medicine_name: str
    dosage: str
    frequency: str
    reminder_time: str
    start_date: str
    end_date: str
    total_quantity: int
    instructions: str | None = None
    remaining_quantity: int
    tablets_per_day: int


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
    is_active: bool = True


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
    is_active: bool

    class Config:
        from_attributes = True

from datetime import datetime

class ReminderHistoryResponse(BaseModel):
    id: int
    medicine_name: str
    dosage: str
    reminder_time: str
    sent_at: datetime
    status: str

    class Config:
        from_attributes = True    


class ChatRequest(BaseModel):
    message: str

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

class AssistantRequest(BaseModel):
    question: str

class AssistantResponse(BaseModel):
    answer: str

class GoogleLogin(BaseModel):
    credential: str     