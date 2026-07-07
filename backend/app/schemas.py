from pydantic import BaseModel, EmailStr

class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    role: str
    phone: str


class UserLogin(BaseModel):
    email: EmailStr
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