import os
import shutil
import uuid

from fastapi import APIRouter, UploadFile, File, HTTPException

from app.services.prescription_ai import extract_prescription
from app.database import get_db
from app.models import Medicine, User

from google.genai import errors

from app.auth import get_current_user
from sqlalchemy.orm import Session
from fastapi import Depends

router = APIRouter(prefix="/ocr", tags=["OCR"])


UPLOAD_FOLDER = "uploads"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@router.post("/prescription")
async def scan_prescription(file: UploadFile = File(...)):

    filename = f"{uuid.uuid4()}.jpg"

    filepath = os.path.join(
        UPLOAD_FOLDER,
        filename
    )

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:

        result = extract_prescription(filepath)

        return result

    except errors.ClientError as e:

        print(e)

        raise HTTPException(
            status_code=429,
            detail="Gemini quota exceeded. Please try again later."
        )

    except Exception as e:

        print(e)

        raise HTTPException(
            status_code=500,
            detail="Prescription scanning failed."
        )

    finally:

        if os.path.exists(filepath):
            os.remove(filepath)

@router.post("/save-prescription")
async def save_prescription(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    medicines = data.get("medicines", [])

    for item in medicines:

        medicine = Medicine(

            # Required
            user_id=current_user.id,   # Use the logged-in user's ID

            medicine_name=item.get("medicine_name", ""),

            dosage=item.get("dosage", ""),

            frequency=item.get("frequency", ""),

            reminder_time="09:00",

            start_date="",

            end_date="",

            instructions=item.get("instructions", ""),

            total_quantity=30,

            remaining_quantity=30,

            tablets_per_day=1,

            is_active=True,

        )

        db.add(medicine)

    db.commit()

    return {
        "message": "Prescription saved successfully"
    }