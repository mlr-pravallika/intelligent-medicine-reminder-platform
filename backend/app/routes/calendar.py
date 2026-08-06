from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models import Medicine, User

router = APIRouter(
    prefix="/calendar",
    tags=["Calendar"]
)


@router.get("/today")
def today_schedule(
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


@router.get("/appointments")
def appointments():

    return []


@router.get("/refills")
def refills(
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

    refill_list = []

    for medicine in medicines:

        if (
            medicine.remaining_quantity is not None
            and
            medicine.tablets_per_day is not None
        ):

            days_left = medicine.remaining_quantity / medicine.tablets_per_day

            refill_list.append({

                "medicine": medicine.medicine_name,

                "remaining_quantity": medicine.remaining_quantity,

                "days_left": round(days_left, 1)

            })

    return refill_list