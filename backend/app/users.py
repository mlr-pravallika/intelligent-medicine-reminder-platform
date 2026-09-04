from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models import User
from app import schemas


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.get(
    "/me",
    response_model=schemas.UserResponse
)
def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    return current_user


@router.put(
    "/me",
    response_model=schemas.UserResponse
)
def update_my_profile(
    profile: schemas.ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    current_user.name = profile.name

    if profile.phone is not None:
        current_user.phone = profile.phone

    if profile.dob is not None:
        current_user.dob = profile.dob

    if profile.gender is not None:
        current_user.gender = profile.gender

    if profile.blood_group is not None:
        current_user.blood_group = profile.blood_group

    if profile.height is not None:
        current_user.height = profile.height

    if profile.weight is not None:
        current_user.weight = profile.weight

    if profile.allergies is not None:
        current_user.allergies = profile.allergies

    if profile.medical_conditions is not None:
        current_user.medical_conditions = profile.medical_conditions

    if profile.preferred_language is not None:
        current_user.preferred_language = profile.preferred_language

    if profile.address is not None:
        current_user.address = profile.address

    db.commit()
    db.refresh(current_user)

    return current_user