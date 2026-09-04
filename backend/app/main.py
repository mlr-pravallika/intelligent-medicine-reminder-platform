from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import date, timedelta, datetime, timezone
from app.routers import ocr, assistant, refill
from .import crud
from app.ai_service import ask_ai
from app.schemas import AssistantRequest
from .models import User, PasswordResetCode
from app.database import engine, Base
from app import models
from .schemas import (
    UserRegister,
    UserLogin,
    ProfileUpdate,
    UserResponse,
    MedicineCreate,
    MedicineUpdate,
    MedicineResponse,
    ReminderHistoryResponse,
    GoogleLogin,
    ForgotPasswordRequest,
    VerifyResetCodeRequest,
    ResetPasswordRequest,
)
import hashlib
import secrets
import re
from app.google_auth import verify_google_token
from app.routers import users
from app.routers import calendar
from app.routers import reminder
from app.routers import notifications
from app.routers import analytics
from .auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user
)
from .email_service import (
    send_email,
    send_verification_code_email,
    send_password_reset_success_email,
)
from app.sms_service import send_sms
from .models import Medicine, ReminderHistory
from . import scheduler
from .schemas import MedicineCreate, MedicineResponse
from .schemas import (
    MedicineNameValidationRequest,
    MedicineNameValidationResponse,
)
from .auth import get_current_user
from google.oauth2 import id_token
from google.auth.transport import requests
from app.schemas import GoogleLogin

from fastapi.middleware.cors import CORSMiddleware
from fastapi import APIRouter

from app.google_auth import verify_google_token

from app.auth import create_access_token

from app.models import User

from app.routers import ocr

from app.database import get_db
from sqlalchemy.orm import Session
from fastapi import Depends
from app.ai_service import (
    ask_ai,
    validate_medicine_name as ai_validate_medicine_name,
)
from app import users
from app import caregiver
from app import admin
from .schemas import ChatRequest

app = FastAPI(
    title="MediCare AI API",
    description="AI-Powered Intelligent Medication Management Platform",
    version="1.0.0"
)

app.include_router(ocr.router)
app.include_router(assistant.router)
app.include_router(refill.router)
app.include_router(calendar.router)
app.include_router(notifications.router)
app.include_router(analytics.router)
app.include_router(reminder.router)

app.include_router(users.router)
app.include_router(caregiver.router)
app.include_router(admin.router)

def hash_reset_code(code: str) -> str:
    return hashlib.sha256(
        code.encode("utf-8")
    ).hexdigest()


def validate_new_password(password: str):

    if len(password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least 8 characters"
        )

    if not re.search(r"[A-Z]", password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one uppercase letter"
        )

    if not re.search(r"[a-z]", password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one lowercase letter"
        )

    if not re.search(r"\d", password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one number"
        )

    if not re.search(r"[^\w\s]", password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one special character"
        )

    

@app.on_event("startup")
def startup_event():
    scheduler.start_scheduler()
    Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "https://mlr-pravallika-health-wise-ai-80.pravallikamarri55.workers.dev",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

    print("=" * 50)
    print("Entered Password :", user.password)
    print("Password Length :", len(user.password))
    print("Stored Hash :", db_user.password_hash)
    print("Hash Length :", len(db_user.password_hash))
    print("=" * 50)

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

@app.get("/me")
def get_profile(
    current_user: User = Depends(get_current_user)
):
    return {
        "id": current_user.id,

        "name": current_user.name,

        "email": current_user.email,

        "phone": current_user.phone,

        "role": current_user.role,

        "dob": current_user.dob,

        "gender": current_user.gender,

        "blood_group": current_user.blood_group,

        "height": current_user.height,

        "weight": current_user.weight,

        "allergies": current_user.allergies,

        "medical_conditions": current_user.medical_conditions,

        "preferred_language": current_user.preferred_language,

        "address": current_user.address,
    }


@app.put(
    "/profile/{user_id}",
    response_model=UserResponse,
    tags=["Profile"],
)
def update_profile(
    user_id: int,
    profile: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update the currently authenticated user's profile.

    The frontend may send the logged-in user's id in the URL, but the
    authenticated user is always used as the source of truth.
    This prevents one patient from modifying another patient's profile.
    """

    if user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can update only your own profile.",
        )

    try:
        db_user = (
            db.query(User)
            .filter(
                User.id == current_user.id,
            )
            .first()
        )

        if db_user is None:
            raise HTTPException(
                status_code=404,
                detail="Profile not found.",
            )

        # Required field
        db_user.name = profile.name.strip()

        # Optional fields
        db_user.phone = (
            profile.phone.strip()
            if profile.phone is not None
            else ""
        )

        db_user.dob = profile.dob or ""
        db_user.gender = profile.gender or ""
        db_user.blood_group = profile.blood_group or ""
        db_user.height = profile.height or ""
        db_user.weight = profile.weight or ""
        db_user.allergies = profile.allergies or ""
        db_user.medical_conditions = (
            profile.medical_conditions or ""
        )
        db_user.preferred_language = (
            profile.preferred_language or "English"
        )
        db_user.address = profile.address or ""

        db.commit()
        db.refresh(db_user)

        print(
            "Profile updated successfully:",
            db_user.id,
        )

        return db_user

    except HTTPException:
        raise

    except Exception as exc:
        db.rollback()

        print("=" * 60)
        print("PROFILE UPDATE ERROR")
        print(repr(exc))
        print("=" * 60)

        raise HTTPException(
            status_code=500,
            detail="Unable to update profile.",
        ) from exc


@app.get("/dashboard", tags=["Dashboard"])
def dashboard(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    return {
        "message": "Dashboard accessed successfully",
        "token_received": token
    }

@app.post(
    "/medicines/validate-name",
    tags=["Medicine"],
)
def validate_medicine_name(
    request: MedicineNameValidationRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Validate a medicine name from the frontend.

    The frontend sends:
        {"medicine_name": "Paracetamol"}

    This endpoint delegates validation to ai_service.py.
    """
    medicine_name = request.medicine_name.strip()

    if not medicine_name:
        return MedicineNameValidationResponse(
            valid=False,
            medicine_name="",
            message="Medicine name is required.",
        )

    try:
        validation = ai_validate_medicine_name(
            medicine_name
        )

        if isinstance(validation, dict):
            return {
                "valid": bool(
                    validation.get("valid", False)
                ),
                "medicine_name": validation.get(
                    "medicine_name",
                    medicine_name,
                ),
                "message": validation.get(
                    "message",
                    "Medicine validation completed.",
                ),
                "suggestion": validation.get(
                    "suggestion"
                ),
                **(
                    {
                        "available":
                            validation.get(
                                "available",
                                True,
                            )
                    }
                ),
            }

        return {
            "valid": False,
            "available": False,
            "medicine_name": medicine_name,
            "message": (
                "Medicine verification is temporarily unavailable. "
                "Please try again."
            ),
            "suggestion": None,
        }

    except Exception as exc:
        print(
            "Medicine validation error:",
            repr(exc),
        )

        return {
            "valid": False,
            "available": False,
            "medicine_name": medicine_name,
            "message": (
                "Medicine verification is temporarily unavailable. "
                "Please try again."
            ),
            "suggestion": None,
        }


@app.post(
    "/medicines",
    response_model=MedicineResponse,
    tags=["Medicine"],
)
def add_medicine(
    medicine: MedicineCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a medicine for the logged-in patient.

    Includes:
    - AI validation
    - duplicate prevention
    - multiple reminder times
    - quantity tracking
    - low-stock threshold
    """
    try:
        medicine_name = medicine.medicine_name.strip()

        # --------------------------------------------------
        # AI MEDICINE VALIDATION
        # --------------------------------------------------
        validation = ai_validate_medicine_name(
            medicine_name
        )

        if not isinstance(validation, dict):
            raise HTTPException(
                status_code=503,
                detail=(
                    "Medicine verification is temporarily unavailable."
                ),
            )

        if validation.get("available") is False:
            raise HTTPException(
                status_code=503,
                detail=validation.get(
                    "message",
                    "Medicine verification is temporarily unavailable.",
                ),
            )

        if not validation.get("valid", False):
            raise HTTPException(
                status_code=400,
                detail=validation.get(
                    "message",
                    "The entered name was not recognized as a medicine.",
                ),
            )

        # --------------------------------------------------
        # DUPLICATE CHECK
        #
        # Same patient + same medicine name is treated as
        # an existing medicine. The patient can edit the
        # existing record rather than creating duplicates.
        # --------------------------------------------------
        existing = (
            db.query(Medicine)
            .filter(
                Medicine.user_id == current_user.id,
                Medicine.medicine_name.ilike(
                    medicine_name
                ),
            )
            .first()
        )

        if existing:
            raise HTTPException(
                status_code=409,
                detail=(
                    f"{existing.medicine_name} "
                    "is already registered in your account."
                ),
            )

        # --------------------------------------------------
        # VALIDATE QUANTITY / LOW STOCK VALUES
        # --------------------------------------------------
        if medicine.total_quantity <= 0:
            raise HTTPException(
                status_code=400,
                detail="Quantity must be greater than zero.",
            )

        if medicine.remaining_quantity < 0:
            raise HTTPException(
                status_code=400,
                detail="Remaining quantity cannot be negative.",
            )

        if medicine.remaining_quantity > medicine.total_quantity:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Remaining quantity cannot be greater "
                    "than total quantity."
                ),
            )

        low_stock_threshold = (
            medicine.low_stock_threshold
            if medicine.low_stock_threshold is not None
            else 5
        )

        if low_stock_threshold < 1:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Low Stock Alert must be at least 1 tablet."
                ),
            )

        if low_stock_threshold >= medicine.total_quantity:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Low Stock Alert must be lower "
                    "than the starting quantity."
                ),
            )

        # --------------------------------------------------
        # CREATE MEDICINE
        # --------------------------------------------------
        new_medicine = Medicine(
            user_id=current_user.id,

            medicine_name=medicine_name,

            dosage=medicine.dosage.strip(),

            frequency=medicine.frequency.strip(),

            reminder_time=medicine.reminder_time.strip(),

            start_date=medicine.start_date,

            end_date=medicine.end_date,

            instructions=medicine.instructions,

            total_quantity=medicine.total_quantity,

            remaining_quantity=medicine.remaining_quantity,

            tablets_per_day=medicine.tablets_per_day,

            low_stock_threshold=low_stock_threshold,

            is_active=True,
        )

        db.add(new_medicine)
        db.commit()
        db.refresh(new_medicine)

        print(
            "✅ Medicine saved:",
            new_medicine.medicine_name,
            "ID:",
            new_medicine.id,
        )

        return new_medicine

    except HTTPException:
        raise

    except Exception as exc:
        db.rollback()

        print("=" * 60)
        print("🔥 ADD MEDICINE ERROR")
        print(repr(exc))
        print("=" * 60)

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )


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
    tags=["Medicine"],
)
def update_medicine(
    medicine_id: int,
    medicine: MedicineUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        db_medicine = (
            db.query(Medicine)
            .filter(
                Medicine.id == medicine_id,
                Medicine.user_id == current_user.id,
            )
            .first()
        )

        if db_medicine is None:
            raise HTTPException(
                status_code=404,
                detail="Medicine not found.",
            )

        incoming_name = medicine.medicine_name.strip()
        existing_name = (
            db_medicine.medicine_name or ""
        ).strip()

        # Do not call Gemini again when editing the existing
        # medicine without changing its name.
        if incoming_name.lower() != existing_name.lower():
            validation = ai_validate_medicine_name(
                incoming_name
            )

            if not isinstance(validation, dict):
                raise HTTPException(
                    status_code=503,
                    detail="Medicine verification is temporarily unavailable.",
                )

            if validation.get("available") is False:
                raise HTTPException(
                    status_code=503,
                    detail=validation.get(
                        "message",
                        "Medicine verification is temporarily unavailable.",
                    ),
                )

            if not validation.get("valid", False):
                raise HTTPException(
                    status_code=400,
                    detail=validation.get(
                        "message",
                        "The entered name was not recognized as a medicine.",
                    ),
                )

        # Prevent accidental duplicates for this patient.
        duplicate = (
            db.query(Medicine)
            .filter(
                Medicine.user_id == current_user.id,
                Medicine.id != medicine_id,
                Medicine.medicine_name.ilike(incoming_name),
            )
            .first()
        )

        if duplicate:
            raise HTTPException(
                status_code=409,
                detail=(
                    f"{duplicate.medicine_name} is already registered "
                    "in your account."
                ),
            )

        total_quantity = medicine.total_quantity
        remaining_quantity = medicine.remaining_quantity
        low_stock_threshold = medicine.low_stock_threshold

        if total_quantity <= 0:
            raise HTTPException(
                status_code=400,
                detail="Total quantity must be greater than zero.",
            )

        if remaining_quantity < 0:
            raise HTTPException(
                status_code=400,
                detail="Remaining quantity cannot be negative.",
            )

        if remaining_quantity > total_quantity:
            raise HTTPException(
                status_code=400,
                detail="Remaining quantity cannot be greater than total quantity.",
            )

        if low_stock_threshold < 1:
            raise HTTPException(
                status_code=400,
                detail="Low Stock Alert must be at least 1 tablet.",
            )

        if low_stock_threshold >= total_quantity:
            raise HTTPException(
                status_code=400,
                detail="Low Stock Alert must be lower than the starting quantity.",
            )

        db_medicine.medicine_name = incoming_name
        db_medicine.dosage = medicine.dosage.strip()
        db_medicine.frequency = medicine.frequency.strip()
        db_medicine.reminder_time = medicine.reminder_time.strip()
        db_medicine.start_date = medicine.start_date
        db_medicine.end_date = medicine.end_date
        db_medicine.instructions = medicine.instructions
        db_medicine.total_quantity = total_quantity
        db_medicine.remaining_quantity = remaining_quantity
        db_medicine.tablets_per_day = medicine.tablets_per_day
        db_medicine.low_stock_threshold = low_stock_threshold
        db_medicine.is_active = medicine.is_active

        db.commit()
        db.refresh(db_medicine)

        print(
            "✅ Medicine updated:",
            db_medicine.medicine_name,
            "ID:",
            db_medicine.id,
        )

        return db_medicine

    except HTTPException:
        raise

    except Exception as exc:
        db.rollback()

        print("=" * 60)
        print("🔥 UPDATE MEDICINE ERROR")
        print(repr(exc))
        print("=" * 60)

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )


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

@app.get("/calendar")
def calendar_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    medicines = (
        db.query(Medicine)
        .filter(
            Medicine.user_id == current_user.id,
            Medicine.is_active == True
        )
        .all()
    )

    return medicines    

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

        today_reminders = 0

        for medicine in medicines:

            if not medicine.is_active:
                continue

            if not medicine.reminder_time:
                continue

            reminder_times = [
                time.strip()
                for time in medicine.reminder_time.split(",")
                if time.strip()
            ]

            today_reminders += len(
                reminder_times
            )

        expiring_soon = 0

        for m in medicines:

            if m.end_date:

                try:
                    end_date = datetime.strptime(
                        m.end_date,
                        "%Y-%m-%d"
                    ).date()

                    if date.today() <= end_date <= date.today() + timedelta(days=7):
                        expiring_soon += 1

                except ValueError:
                    pass

        refill = crud.get_refill_count(
            db,
            current_user.id
        )

        return {

            "total_medicines": total_medicines,

            "active_medicines": active_medicines,

            "today_reminders": today_reminders,

            "expiring_soon": expiring_soon,

            "refill_soon": refill
        }  

    except Exception as e:

        print("🔥 Dashboard Error:", str(e))

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@app.get("/dashboard/today-medicines")
def get_today_medicines(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    medicines = (
        db.query(Medicine)
        .filter(
            Medicine.user_id == current_user.id,
            Medicine.is_active == True
        )
        .all()
    )

    return medicines

@app.get("/dashboard/notifications")
def dashboard_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    notifications = crud.get_notifications(
        db,
        current_user.id
    )

    return notifications

@app.get("/dashboard/weekly")
def dashboard_weekly(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    history = (
        db.query(ReminderHistory)
        .filter(
            ReminderHistory.user_id == current_user.id
        )
        .all()
    )

    taken = len([
        h for h in history
        if h.status == "Taken"
    ])

    missed = len([
        h for h in history
        if h.status == "Missed"
    ])

    return [

        {

            "label": "This Week",

            "taken": taken,

            "missed": missed

        }

    ]

@app.get("/dashboard/monthly")
def dashboard_monthly(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    history = (
        db.query(ReminderHistory)
        .filter(
            ReminderHistory.user_id == current_user.id
        )
        .all()
    )

    taken = len([
        h for h in history
        if h.status == "Taken"
    ])

    missed = len([
        h for h in history
        if h.status == "Missed"
    ])

    total = taken + missed

    adherence = 0

    if total > 0:

        adherence = round((taken / total) * 100)

    return [

        {

            "label": "This Month",

            "adherence": adherence

        }

    ]

@app.get("/dashboard/activity")
def dashboard_activity(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    history = (
        db.query(ReminderHistory)
        .filter(
            ReminderHistory.user_id == current_user.id
        )
        .order_by(
            ReminderHistory.id.desc()
        )
        .limit(10)
        .all()
    )

    return history


    
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

@app.post("/assistant/chat")
def assistant_chat(
    request: AssistantRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    medicines = (
        db.query(Medicine)
        .filter(
            Medicine.user_id == current_user.id
        )
        .all()
    )

    answer = ask_ai(
        request.question,
        medicines
    )

    return {
        "answer": answer
    }


@app.post("/auth/google")
def google_login(
    request: GoogleLogin,
    db: Session = Depends(get_db)
):

    google_user = verify_google_token(
        request.credential
    )

    email = google_user["email"]

    name = google_user.get("name", "Google User")

    user = db.query(User).filter(
        User.email == email
    ).first()

    if user is None:

        user = User(

            name=name,

            email=email,

            role="patient",

            phone="",

            password_hash="GOOGLE_LOGIN"

        )

        db.add(user)

        db.commit()

        db.refresh(user)

    token = create_access_token(

        {

            "sub": str(user.id),

            "role": user.role

        }

    )

    return {

        "access_token": token,

        "token_type": "bearer"

    }

@app.post(
    "/auth/forgot-password",
    tags=["Authentication"]
)
def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):

    user = (
        db.query(User)
        .filter(
            User.email == request.email
        )
        .first()
    )

    generic_response = {
        "message": (
            "If an account exists for this email, "
            "a verification code has been sent."
        )
    }

    if user is None:
        return generic_response

    now = datetime.now(timezone.utc)

    recent_request = (
        db.query(PasswordResetCode)
        .filter(
            PasswordResetCode.user_id == user.id,
            PasswordResetCode.created_at >= (
                now - timedelta(seconds=60)
            ),
            PasswordResetCode.used == False
        )
        .first()
    )

    if recent_request:
        return generic_response

    # Invalidate older reset codes
    (
        db.query(PasswordResetCode)
        .filter(
            PasswordResetCode.user_id == user.id,
            PasswordResetCode.used == False
        )
        .update({
            PasswordResetCode.used: True
        })
    )

    verification_code = str(
        secrets.randbelow(1_000_000)
    ).zfill(6)

    code_hash = hash_reset_code(
        verification_code
    )

    reset_record = PasswordResetCode(
        user_id=user.id,
        code_hash=code_hash,
        expires_at=now + timedelta(minutes=10),
        attempts=0,
        used=False,
    )

    db.add(reset_record)
    db.commit()

    send_verification_code_email(
        receiver_email=user.email,
        verification_code=verification_code
    )

    return generic_response

@app.post(
    "/auth/verify-reset-code",
    tags=["Authentication"]
)
def verify_reset_code(
    request: VerifyResetCodeRequest,
    db: Session = Depends(get_db)
):

    user = (
        db.query(User)
        .filter(
            User.email == request.email
        )
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired verification code"
        )

    reset_record = (
        db.query(PasswordResetCode)
        .filter(
            PasswordResetCode.user_id == user.id,
            PasswordResetCode.used == False
        )
        .order_by(
            PasswordResetCode.id.desc()
        )
        .first()
    )

    if reset_record is None:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired verification code"
        )

    now = datetime.now(timezone.utc)

    if reset_record.expires_at < now:
        reset_record.used = True
        db.commit()

        raise HTTPException(
            status_code=400,
            detail="Verification code has expired"
        )

    if reset_record.attempts >= 5:
        reset_record.used = True
        db.commit()

        raise HTTPException(
            status_code=400,
            detail="Too many verification attempts"
        )

    if hash_reset_code(request.code) != reset_record.code_hash:

        reset_record.attempts += 1
        db.commit()

        raise HTTPException(
            status_code=400,
            detail="Invalid verification code"
        )

    reset_record.verified = True

    db.commit()

    return {
        "verified": True,
        "message": "Verification code is valid"
    }

@app.post(
    "/auth/reset-password",
    tags=["Authentication"]
)
def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):

    validate_new_password(
        request.new_password
    )

    user = (
        db.query(User)
        .filter(
            User.email == request.email
        )
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired verification code"
        )

    reset_record = (
        db.query(PasswordResetCode)
        .filter(
            PasswordResetCode.user_id == user.id,
            PasswordResetCode.used == False,
            PasswordResetCode.verified == True
        )
        .order_by(
            PasswordResetCode.id.desc()
        )
        .first()
    )

    if reset_record is None:
        raise HTTPException(
            status_code=400,
            detail="Please verify your email code first"
        )

    now = datetime.now(timezone.utc)

    if reset_record.expires_at < now:

        reset_record.used = True
        db.commit()

        raise HTTPException(
            status_code=400,
            detail="Verification code has expired"
        )

    if hash_reset_code(request.code) != reset_record.code_hash:

        reset_record.attempts += 1

        if reset_record.attempts >= 5:
            reset_record.used = True

        db.commit()

        raise HTTPException(
            status_code=400,
            detail="Invalid verification code"
        )

    user.password_hash = hash_password(
        request.new_password
    )

    reset_record.used = True
    reset_record.verified = False

    db.commit()

    send_password_reset_success_email(
        receiver_email=user.email
    )

    return {
        "message": (
            "Password reset successfully. "
            "Please login with your new password."
        )
    }
