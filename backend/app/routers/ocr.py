from datetime import date, timedelta
from typing import Any

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Medicine, User
from app.services.prescription_ai import extract_prescription


router = APIRouter(
    prefix="/ocr",
    tags=["OCR"],
)


# ============================================================
# FILE VALIDATION
# ============================================================

ALLOWED_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/bmp",
    "image/tiff",
}

ALLOWED_EXTENSIONS = {
    "jpg",
    "jpeg",
    "png",
    "webp",
    "bmp",
    "tif",
    "tiff",
}


# ============================================================
# HELPERS
# ============================================================

def expected_reminder_count(
    frequency: str,
) -> int:
    value = (frequency or "").strip().lower()

    if "three times daily" in value:
        return 3

    if "twice daily" in value:
        return 2

    return 1


def normalize_times(
    reminder_time: Any = None,
    reminder_times: Any = None,
) -> list[str]:
    """
    Accept all common OCR/frontend formats:

    reminder_time = "09:00,21:00"
    reminder_times = ["09:00", "21:00"]
    reminder_times = "09:00,21:00"
    """

    value = (
        reminder_times
        if reminder_times is not None
        else reminder_time
    )

    if value is None:
        return []

    if isinstance(value, list):
        result = [
            str(item).strip()
            for item in value
            if str(item).strip()
        ]
        return result

    if isinstance(value, str):
        return [
            item.strip()
            for item in value.split(",")
            if item.strip()
        ]

    return []


def normalize_frequency(
    frequency: Any,
) -> str:
    value = str(
        frequency or ""
    ).strip()

    if not value:
        return "Once daily"

    return value


def normalize_instructions(
    instructions: Any,
) -> str | None:
    if instructions is None:
        return None

    value = str(instructions).strip()

    return value or None


def parse_quantity(
    quantity: Any,
) -> int:
    if quantity is None:
        return 30

    try:
        value = int(float(quantity))
    except (TypeError, ValueError):
        return 30

    return max(1, value)


def parse_low_stock_threshold(
    value: Any,
    quantity: int,
) -> int:
    if value is None:
        return min(5, max(1, quantity - 1))

    try:
        threshold = int(float(value))
    except (TypeError, ValueError):
        threshold = 5

    threshold = max(1, threshold)

    if threshold >= quantity:
        threshold = max(
            1,
            quantity - 1,
        )

    return threshold


def calculate_dates_from_duration(
    duration: Any,
) -> tuple[str, str]:
    """
    OCR may return:

    "5 days"
    "1 week"
    "7 days"

    Convert that into start/end dates.
    """

    today = date.today()

    if duration is None:
        return (
            today.isoformat(),
            (
                today + timedelta(days=30)
            ).isoformat(),
        )

    text = str(
        duration
    ).strip().lower()

    days = 30

    if "week" in text:
        try:
            number = int(
                "".join(
                    ch
                    for ch in text
                    if ch.isdigit()
                )
                or "1"
            )
        except ValueError:
            number = 1

        days = number * 7

    elif "day" in text:
        try:
            days = int(
                "".join(
                    ch
                    for ch in text
                    if ch.isdigit()
                )
                or "30"
            )
        except ValueError:
            days = 30

    days = max(1, days)

    end_date = (
        today +
        timedelta(
            days=days - 1
        )
    )

    return (
        today.isoformat(),
        end_date.isoformat(),
    )


def normalize_dates(
    start_date: Any = None,
    end_date: Any = None,
    duration: Any = None,
) -> tuple[str, str]:

    start = (
        str(start_date).strip()
        if start_date
        else ""
    )

    end = (
        str(end_date).strip()
        if end_date
        else ""
    )

    if start and end:
        return start, end

    return calculate_dates_from_duration(
        duration
    )


def normalize_dosage(
    dosage: Any,
) -> str:
    value = str(
        dosage or ""
    ).strip()

    return value or "As directed"


# ============================================================
# SAVE SCHEMAS
# ============================================================

class OCRSaveMedicine(BaseModel):
    medicine_name: str = Field(
        min_length=2
    )

    dosage: str = Field(
        min_length=1
    )

    frequency: str = Field(
        default="Once daily"
    )

    # Frontend may use either name.
    reminder_time: str | None = None
    reminder_times: list[str] | str | None = None

    # OCR may return duration instead of dates.
    start_date: str | None = None
    end_date: str | None = None
    duration: str | None = None

    instructions: str | None = None

    # OCR may return null.
    quantity: int | float | None = None

    total_quantity: int | float | None = None
    remaining_quantity: int | float | None = None

    tablets_per_day: int | None = None

    low_stock_threshold: int | None = None


class OCRSaveRequest(BaseModel):
    medicines: list[OCRSaveMedicine]

    @field_validator("medicines")
    @classmethod
    def validate_medicines(
        cls,
        value: list[OCRSaveMedicine],
    ) -> list[OCRSaveMedicine]:

        if not value:
            raise ValueError(
                "At least one medicine is required."
            )

        return value


# ============================================================
# OCR SCAN
# ============================================================

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
        filename.lower().rsplit(
            ".",
            1,
        )[-1]
        if "." in filename
        else ""
    )

    if (
        content_type
        and content_type not in ALLOWED_TYPES
        and extension not in ALLOWED_EXTENSIONS
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_415_UNSUPPORTED_MEDIA_TYPE
            ),
            detail=(
                "Please upload a JPG, PNG, WEBP, BMP or TIFF prescription image."
            ),
        )

    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=(
                "The prescription image is empty."
            ),
        )

    try:
        result = extract_prescription(
            image_bytes=image_bytes,
            filename=filename,
        )

        medicines = (
            result.get(
                "medicines",
                [],
            )
            if isinstance(result, dict)
            else []
        )

        print(
            "Gemini Vision medicines:",
            medicines,
        )

        return {
            "medicines": medicines,
            "doctor_name": (
                result.get(
                    "doctor_name",
                    "",
                )
                if isinstance(result, dict)
                else ""
            ),
            "hospital": (
                result.get(
                    "hospital",
                    "",
                )
                if isinstance(result, dict)
                else ""
            ),
            "patient_name": (
                result.get(
                    "patient_name",
                    "",
                )
                if isinstance(result, dict)
                else ""
            ),
            "date": (
                result.get(
                    "date",
                    "",
                )
                if isinstance(result, dict)
                else ""
            ),
        }

    except HTTPException:
        raise

    except Exception as exc:
        print(
            "OCR ERROR:",
            repr(exc),
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "Prescription scanning failed. "
                "Please try another clear image."
            ),
        )


# ============================================================
# SAVE ALL OCR MEDICINES
# ============================================================

@router.post("/save-prescription")
def save_prescription_medicines(
    payload: OCRSaveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Save all reviewed OCR medicines
    for the currently logged-in patient.

    The endpoint is intentionally tolerant
    of OCR/frontend field variations.
    """

    if not payload.medicines:
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=(
                "No medicines were provided."
            ),
        )

    saved: list[dict[str, Any]] = []
    skipped: list[dict[str, Any]] = []

    try:
        for item in payload.medicines:

            name = (
                item.medicine_name
                .strip()
            )

            if len(name) < 2:
                skipped.append({
                    "medicine_name": name,
                    "reason": (
                        "Invalid medicine name."
                    ),
                })
                continue

            frequency = (
                normalize_frequency(
                    item.frequency
                )
            )

            # ----------------------------------------
            # Reminder times
            # ----------------------------------------

            times = normalize_times(
                reminder_time=(
                    item.reminder_time
                ),
                reminder_times=(
                    item.reminder_times
                ),
            )

            if not times:
                times = ["09:00"]

            expected_count = (
                expected_reminder_count(
                    frequency
                )
            )

            # OCR sometimes cannot read
            # exact clock times.
            # Generate editable defaults.
            defaults = [
                "09:00",
                "14:00",
                "21:00",
            ]

            normalized_times = []

            for index in range(
                expected_count
            ):
                if index < len(times):
                    normalized_times.append(
                        times[index]
                    )
                else:
                    normalized_times.append(
                        defaults[index]
                    )

            reminder_time = ",".join(
                normalized_times
            )

            # ----------------------------------------
            # Dates
            # ----------------------------------------

            start_date, end_date = (
                normalize_dates(
                    start_date=(
                        item.start_date
                    ),
                    end_date=(
                        item.end_date
                    ),
                    duration=(
                        item.duration
                    ),
                )
            )

            # ----------------------------------------
            # Quantity
            # ----------------------------------------

            raw_quantity = (
                item.total_quantity
                if item.total_quantity
                is not None
                else item.quantity
            )

            quantity = parse_quantity(
                raw_quantity
            )

            raw_remaining = (
                item.remaining_quantity
            )

            if raw_remaining is None:
                remaining_quantity = (
                    quantity
                )
            else:
                try:
                    remaining_quantity = max(
                        0,
                        int(
                            float(
                                raw_remaining
                            )
                        ),
                    )
                except (
                    TypeError,
                    ValueError,
                ):
                    remaining_quantity = (
                        quantity
                    )

            # ----------------------------------------
            # Tablets per day
            # ----------------------------------------

            tablets_per_day = (
                item.tablets_per_day
                if item.tablets_per_day
                and item.tablets_per_day > 0
                else expected_count
            )

            # ----------------------------------------
            # Low stock
            # ----------------------------------------

            low_stock_threshold = (
                parse_low_stock_threshold(
                    item.low_stock_threshold,
                    quantity,
                )
            )

            # ----------------------------------------
            # Dosage
            # ----------------------------------------

            dosage = normalize_dosage(
                item.dosage
            )

            instructions = (
                normalize_instructions(
                    item.instructions
                )
            )

            # ----------------------------------------
            # Duplicate detection
            # ----------------------------------------

            duplicate = (
                db.query(Medicine)
                .filter(
                    Medicine.user_id
                    == current_user.id,
                    Medicine.medicine_name.ilike(
                        name
                    ),
                )
                .first()
            )

            if duplicate:

                skipped.append({
                    "medicine_name": name,
                    "reason": (
                        "Already registered."
                    ),
                    "id": duplicate.id,
                })

                continue

            # ----------------------------------------
            # Create medicine
            # ----------------------------------------

            medicine = Medicine(
                user_id=current_user.id,
                medicine_name=name,
                dosage=dosage,
                frequency=frequency,
                reminder_time=reminder_time,
                start_date=start_date,
                end_date=end_date,
                instructions=instructions,
                total_quantity=quantity,
                remaining_quantity=(
                    remaining_quantity
                ),
                tablets_per_day=(
                    tablets_per_day
                ),
                low_stock_threshold=(
                    low_stock_threshold
                ),
                is_active=True,
            )

            db.add(medicine)

            # Flush gives us the generated ID
            # without committing yet.
            db.flush()

            saved.append({
                "id": medicine.id,
                "medicine_name": (
                    medicine.medicine_name
                ),
                "dosage": (
                    medicine.dosage
                ),
                "frequency": (
                    medicine.frequency
                ),
                "reminder_time": (
                    medicine.reminder_time
                ),
                "start_date": (
                    medicine.start_date
                ),
                "end_date": (
                    medicine.end_date
                ),
                "total_quantity": (
                    medicine.total_quantity
                ),
                "remaining_quantity": (
                    medicine.remaining_quantity
                ),
                "tablets_per_day": (
                    medicine.tablets_per_day
                ),
                "low_stock_threshold": (
                    medicine.low_stock_threshold
                ),
            })

        # --------------------------------------------
        # Commit all medicines together
        # --------------------------------------------

        db.commit()

        print(
            "OCR SAVE SUCCESS:",
            {
                "user_id": current_user.id,
                "saved_count": len(saved),
                "skipped_count": len(skipped),
            },
        )

        return {
            "success": True,
            "message": (
                "Prescription medicines processed successfully."
            ),
            "saved_count": len(saved),
            "skipped_count": len(skipped),
            "saved": saved,
            "skipped": skipped,
        }

    except Exception as exc:

        db.rollback()

        print(
            "OCR SAVE ERROR:",
            repr(exc),
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "Unable to save prescription medicines. "
                "Please try again."
            ),
        )