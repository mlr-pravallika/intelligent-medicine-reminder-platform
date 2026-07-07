from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from .database import Base, engine, get_db
from .models import User
from .schemas import UserRegister, UserLogin, ProfileUpdate, UserResponse
from .auth import hash_password, verify_password, create_access_token

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Intelligent Medicine Reminder API"
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
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(user.password, db_user.password_hash):
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