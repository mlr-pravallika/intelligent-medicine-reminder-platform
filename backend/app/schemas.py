from pydantic import BaseModel, EmailStr
from datetime import datetime

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


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    phone: str

    class Config:
        from_attributes = True


class MedicineCreate(BaseModel):
    medicine_name: str
    dosage: str
    frequency: str
    reminder_time: str
    start_date: str
    end_date: str
    instructions: str | None = None


class MedicineUpdate(BaseModel):
    medicine_name: str
    dosage: str
    frequency: str
    reminder_time: str
    start_date: str
    end_date: str
    instructions: str | None = None
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
    is_active: bool

    class Config:
        from_attributes = True

class ReminderHistoryResponse(BaseModel):
    id: int
    medicine_name: str
    dosage: str
    reminder_time: str
    sent_at: datetime
    status: str

    class Config:
        from_attributes = True        