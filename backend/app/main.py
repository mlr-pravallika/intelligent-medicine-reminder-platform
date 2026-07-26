from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import date

from .database import Base, engine, get_db
from .models import User
from .schemas import (
    UserRegister,
    UserLogin,
    ProfileUpdate,
    UserResponse,
    MedicineCreate,
    MedicineUpdate,
    MedicineResponse,
    ReminderHistoryResponse
)
from .auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user
)
from .email_service import send_email
from app.sms_service import send_sms
from .models import Medicine, ReminderHistory
from . import scheduler
from .schemas import MedicineCreate, MedicineResponse
from .auth import get_current_user

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="MediCare AI API",
    description="AI-Powered Intelligent Medication Management Platform",
    version="1.0.0"
)

@app.on_event("startup")
def startup_event():
    scheduler.start_scheduler()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

security = HTTPBearer()


@app.get("/", tags=["General"])
def home():
    return {
        "message": "Medicine Reminder API is running"
    }


@app.post("/register", response_model=UserResponse, tags=["Authentication"])
def register(user: UserRegister, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    hashed_password = hash_password(user.password)

    new_user = User(
        name=user.name,
        email=user.email,
        password_hash=hashed_password,
        role=user.role,
        phone=user.phone
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@app.post("/login", tags=["Authentication"])
def login(user: UserLogin, db: Session = Depends(get_db)):

    db_user = db.query(User).filter(User.email == user.email).first()

    if not db_user:
        print("❌ User not found")
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    print("Entered Password :", user.password)
    print("Stored Hash :", db_user.password_hash)

    result = verify_password(
        user.password,
        db_user.password_hash
    )

    print("Password Match :", result)

    if not result:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    token = create_access_token(
        data={
            "sub": str(db_user.id),
            "role": db_user.role
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }

@app.get("/me", tags=["Authentication"])
def get_profile(
    current_user: User = Depends(get_current_user)
):
    return current_user


@app.get("/dashboard", tags=["Dashboard"])
def dashboard(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    return {
        "message": "Dashboard accessed successfully",
        "token_received": token
    }


@app.put(
    "/profile/{user_id}",
    response_model=UserResponse,
    tags=["Profile"]
)
def update_profile(
    user_id: int,
    profile: ProfileUpdate,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # Optional but important: prevent one logged-in user
    # from editing another user's profile.
    # We will connect this properly after decoding JWT.
    
    if profile.name is not None:
        user.name = profile.name

    if profile.phone is not None:
        user.phone = profile.phone

    db.commit()
    db.refresh(user)

    return user

@app.post(
    "/medicines",
    response_model=MedicineResponse,
    tags=["Medicine"]
)

def add_medicine(
    medicine: MedicineCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    new_medicine = Medicine(
        medicine_name=medicine.medicine_name,
        dosage=medicine.dosage,
        frequency=medicine.frequency,
        reminder_time=medicine.reminder_time,
        start_date=medicine.start_date,
        end_date=medicine.end_date,
        instructions=medicine.instructions,
        user_id=current_user.id
    )

    db.add(new_medicine)
    db.commit()
    db.refresh(new_medicine)

    return new_medicine

@app.get(
    "/medicines",
    response_model=list[MedicineResponse],
    tags=["Medicine"]
)
def get_all_medicines(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    medicines = db.query(Medicine).filter(
        Medicine.user_id == current_user.id
    ).all()
    return medicines

@app.get("/medicines/{medicine_id}")
def get_medicine(
    medicine_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    medicine = (
        db.query(Medicine)
        .filter(
            Medicine.id == medicine_id,
            Medicine.user_id == current_user.id
        )
        .first()
    )

    if medicine is None:
        raise HTTPException(
            status_code=404,
            detail="Medicine not found"
        )

    return medicine

@app.put(
    "/medicines/{medicine_id}",
    response_model=MedicineResponse,
    tags=["Medicine"]
)
def update_medicine(
    medicine_id: int,
    medicine: MedicineUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_medicine = (
        db.query(Medicine)
        .filter(
            Medicine.id == medicine_id,
            Medicine.user_id == current_user.id
        )
        .first()
    )

    if not db_medicine:
        raise HTTPException(
            status_code=404,
            detail="Medicine not found"
        )
    
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

@app.patch(
    "/medicines/{medicine_id}/toggle",
    response_model=MedicineResponse,
    tags=["Medicine"]
)
def toggle_medicine_status(
    medicine_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    medicine = (
        db.query(Medicine)
        .filter(
            Medicine.id == medicine_id,
            Medicine.user_id == current_user.id
        )
        .first()
    )

    if not medicine:
        raise HTTPException(
            status_code=404,
            detail="Medicine not found"
        )

    medicine.is_active = not medicine.is_active

    db.commit()
    db.refresh(medicine)

    return medicine

@app.delete(
    "/medicines/{medicine_id}",
    tags=["Medicine"]
)
def delete_medicine(
    medicine_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    
    medicine = (
        db.query(Medicine)
        .filter(
            Medicine.id == medicine_id,
            Medicine.user_id == current_user.id
        )
        .first()
    )

    if not medicine:
        raise HTTPException(
            status_code=404,
            detail="Medicine not found"
        )
    
    db.delete(medicine)
    db.commit()

    return {
        "message": "Medicine deleted successfully"
    }

@app.get("/dashboard/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    try:

        medicines = db.query(Medicine).filter(
            Medicine.user_id == current_user.id
        ).all()

        total_medicines = len(medicines)

        active_medicines = len([
            m for m in medicines
            if m.is_active
        ])

        today_reminders = db.query(
            ReminderHistory
        ).filter(
            ReminderHistory.user_id == current_user.id
        ).count()

        return {
            "total_medicines": total_medicines,
            "active_medicines": active_medicines,
            "today_reminders": today_reminders,
            "expiring_soon": 0
        }

    except Exception as e:

        print("🔥 Dashboard Error:", str(e))

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
    
@app.get("/test-email", tags=["Testing"])
def test_email():

    send_email(
        receiver_email="pravallikamarri29@gmail.com",
        medicine_name="Paracetamol",
        dosage="500mg",
        reminder_time="10:00 PM"
    )

    return {
        "message": "Email sent successfully"
    }

@app.get("/test-sms", tags=["SMS"])
def test_sms():

    send_sms(
        receiver_phone="+918019224955",
        message="Hello! This is a Medicine Reminder SMS from FastAPI."
    )

    return {
        "message": "SMS request sent."
    }

@app.get(
    "/history",
    response_model=list[ReminderHistoryResponse],
    tags=["History"],
)
def get_history(db: Session = Depends(get_db),
                current_user: User = Depends(get_current_user)):
    history = (
        db.query(ReminderHistory)
        .filter(ReminderHistory.user_id == current_user.id)
        .order_by(ReminderHistory.id.desc())
        .all()
    )

    return history


from datetime import datetime

