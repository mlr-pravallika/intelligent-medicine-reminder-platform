from datetime import datetime, timedelta, timezone
import uuid

from jose import jwt, JWTError

from passlib.context import CryptContext

from fastapi import Depends

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from sqlalchemy.orm import Session

from .database import get_db

from .models import User

from fastapi import Depends, HTTPException

# ---------------- Password Hashing ---------------- #

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


def hash_password(password: str):
    return pwd_context.hash(password)


def verify_password(
    password: str,
    hashed_password: str
):
    return pwd_context.verify(
        password,
        hashed_password
    )


# ---------------- JWT ---------------- #

SECRET_KEY = "medicine-reminder-secret-key"

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 10080

security = HTTPBearer()

def create_access_token(data: dict):

    to_encode = data.copy()

    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({
        "exp": expire,
        "iat": now,
        "jti": str(uuid.uuid4())   # unique ID for every token
    })

    token = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    print("Generated Token:", token)

    return token

def verify_token(token: str):

    return jwt.decode(
        token,
        SECRET_KEY,
        algorithms=[ALGORITHM]
    )

from jose import JWTError

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials

    print("Received Token:", token)

    try:
        payload = verify_token(token)

        print("Decoded Payload:", payload)

        user_id = payload.get("sub")

        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid token (missing sub)"
            )

    except JWTError as e:
        print("JWT ERROR:", repr(e))

        raise HTTPException(
            status_code=401,
            detail=f"Invalid token: {str(e)}"
        )

    user = db.query(User).filter(User.id == int(user_id)).first()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user