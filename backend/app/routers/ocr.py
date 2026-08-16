from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Medicine, User
from app.services.prescription_ai import extract_prescription


router = APIRouter(
    prefix="/ocr",
    tags=["OCR"],
)


ALLOWED_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/bmp",
    "image/tiff",
}


class OCRSaveMedicine(BaseModel):
    medicine_name: str = Field(min_length=2)
    dosage: str = Field(min_length=1)
    frequency: str = Field(min_length=1)
    reminder_time: str = Field(min_length=5)
    start_date: str = Field(min_length=10)
    end_date: str = Field(min_length=10)
    instructions: str | None = None

    total_quantity: int = Field(default=30, ge=1)
    remaining_quantity: int = Field(default=30, ge=0)
    tablets_per_day: int = Field(default=1, ge=1)
    low_stock_threshold: int = Field(default=5, ge=1)


class OCRSaveRequest(BaseModel):
    medicines: List[OCRSaveMedicine]


@router.post("/prescription")
async def scan_prescription(
    file: UploadFile = File(...),
):
    content_type = (
        file.content_type or ""
    ).lower()

    filename = (
        file.filename or "prescription"
    )

    extension = (
        filename.lower().rsplit(".", 1)[-1]
        if "." in filename
        else ""
    )

    allowed_extensions = {
        "jpg",
        "jpeg",
        "png",
        "webp",
        "bmp",
        "tif",
        "tiff",
    }

    if (
        content_type
        and content_type not in ALLOWED_TYPES
        and extension not in allowed_extensions
    ):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Please upload a JPG, PNG, WEBP, BMP or TIFF prescription image.",
        )

    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The prescription image is empty.",
        )

    try:
        result = extract_prescription(
            image_bytes=image_bytes,
            filename=filename,
        )

        return {
            "medicines": result.get("medicines", []),
            "doctor_name": result.get("doctor_name", ""),
            "hospital": result.get("hospital", ""),
            "patient_name": result.get("patient_name", ""),
            "date": result.get("date", ""),
        }

    except Exception as exc:
        print("OCR ERROR:", repr(exc))

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Prescription scanning failed. Please try another clear image.",
        )


@router.post("/save-prescription")
def save_prescription_medicines(
    payload: OCRSaveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Save all reviewed OCR medicines for the logged-in patient.

    Duplicates are skipped instead of creating a second copy.
    """

    if not payload.medicines:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No medicines were provided.",
        )

    saved = []
    skipped = []

    for item in payload.medicines:
        name = item.medicine_name.strip()

        duplicate = (
            db.query(Medicine)
            .filter(
                Medicine.user_id == current_user.id,
                Medicine.medicine_name.ilike(name),
                Medicine.reminder_time == item.reminder_time,
            )
            .first()
        )

        if duplicate:
            skipped.append({
                "medicine_name": name,
                "reason": "Already registered with the same reminder schedule.",
                "id": duplicate.id,
            })
            continue

        medicine = Medicine(
            user_id=current_user.id,
            medicine_name=name,
            dosage=item.dosage.strip(),
            frequency=item.frequency.strip(),
            reminder_time=item.reminder_time.strip(),
            start_date=item.start_date,
            end_date=item.end_date,
            instructions=item.instructions,
            total_quantity=item.total_quantity,
            remaining_quantity=item.remaining_quantity,
            tablets_per_day=item.tablets_per_day,
            low_stock_threshold=item.low_stock_threshold,
            is_active=True,
        )

        db.add(medicine)
        db.flush()

        saved.append({
            "id": medicine.id,
            "medicine_name": medicine.medicine_name,
        })

    db.commit()

    return {
        "message": "Prescription medicines processed successfully.",
        "saved_count": len(saved),
        "skipped_count": len(skipped),
        "saved": saved,
        "skipped": skipped,
    }