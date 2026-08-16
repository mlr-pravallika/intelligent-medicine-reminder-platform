from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user

from app.models import Medicine

from app.refill_service import predict_refill

router = APIRouter(
    prefix="/refill",
    tags=["Refill Prediction"]
)


@router.get("/status")
def refill_status(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    medicines = (
        db.query(Medicine)
        .filter(
            Medicine.user_id == current_user.id
        )
        .all()
    )

    results = []

    for medicine in medicines:

        data = predict_refill(medicine)

        if data:

            results.append({

                "medicine_name": medicine.medicine_name,

                **data
            })

    return results