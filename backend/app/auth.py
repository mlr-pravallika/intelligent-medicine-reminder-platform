from datetime import datetime, timedelta, timezone
import uuid

from jose import jwt, JWTError
from passlib.context import CryptContext

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from sqlalchemy.orm import Session

from .database import get_db
from .models import User


# ============================================================
# PASSWORD HASHING
# ============================================================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(
    password: str,
    hashed_password: str
) -> bool:
    return pwd_context.verify(
        password,
        hashed_password
    )


# ============================================================
# JWT CONFIGURATION
# ============================================================

SECRET_KEY = "medicine-reminder-secret-key"

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 10080

security = HTTPBearer()


# ============================================================
# CREATE ACCESS TOKEN
# ============================================================

def create_access_token(data: dict) -> str:

    to_encode = data.copy()

    now = datetime.now(timezone.utc)

    expire = now + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({
        "exp": expire,
        "iat": now,
        "jti": str(uuid.uuid4())
    })

    token = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return token


# ============================================================
# VERIFY TOKEN
# ============================================================

def verify_token(token: str):

    return jwt.decode(
        token,
        SECRET_KEY,
        algorithms=[ALGORITHM]
    )


# ============================================================
# GET CURRENT USER
# ============================================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:

    token = credentials.credentials

    try:

        payload = verify_token(token)

        user_id = payload.get("sub")

        if user_id is None:

            raise HTTPException(
                status_code=401,
                detail="Invalid token: missing user id"
            )

        try:
            user_id = int(user_id)

        except (TypeError, ValueError):

            raise HTTPException(
                status_code=401,
                detail="Invalid token: invalid user id"
            )

    except JWTError:

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if user is None:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user


# ============================================================
# ROLE AUTHORIZATION
# ============================================================

def require_role(*allowed_roles: str):

    def role_checker(
        current_user: User = Depends(get_current_user)
    ):

        if current_user.role not in allowed_roles:

            raise HTTPException(
                status_code=403,
                detail="You do not have permission to access this resource"
            )

        return current_user

    return role_checker