"""
MediCare AI - prescription OCR using the SAME Gemini client
already used by app.services.ai_service.

Why this version:
- Uses Gemini Vision first for handwritten prescriptions.
- Reuses the existing working Gemini client instead of creating
  another client/key configuration.
- Extracts multiple medicines from one prescription.
- Returns structured fields only; raw OCR/JSON is never sent to frontend.
- Falls back to EasyOCR if Gemini is unavailable.
"""

import io
import json
import re
from typing import Any

from PIL import Image


# IMPORTANT:
# Reuse the existing Gemini client from the working AI service.
# This avoids the previous "GEMINI_API_KEY is not configured" problem
# caused by creating a separate client/config path.
try:
    from app.ai_service import client as gemini_client
except (ImportError, Exception) as exc:
    gemini_client = None
    print(
        "Gemini client import failed:",
        repr(exc),
    )


GEMINI_MODEL = "gemini-flash-latest"


def _empty_result() -> dict:
    return {
        "medicines": [],
        "doctor_name": "",
        "hospital": "",
        "patient_name": "",
        "date": "",
    }


def _clean_json(text: str) -> str:
    text = (text or "").strip()

    text = re.sub(
        r"^```(?:json)?\s*",
        "",
        text,
        flags=re.IGNORECASE,
    )

    text = re.sub(
        r"\s*```$",
        "",
        text,
    )

    # Keep only the JSON object when Gemini adds a sentence around it.
    start = text.find("{")
    end = text.rfind("}")

    if start >= 0 and end > start:
        text = text[start : end + 1]

    return text.strip()


def _normalize_frequency(
    value: Any,
) -> str:
    text = str(value or "").strip()
    compact = re.sub(
        r"\s+",
        "",
        text.lower(),
    )

    if any(
        token in compact
        for token in (
            "1-1-1",
            "1+1+1",
            "111",
            "three",
            "3times",
            "tds",
            "tid",
        )
    ):
        return "Three times daily"

    if any(
        token in compact
        for token in (
            "1-0-1",
            "1+0+1",
            "101",
            "twice",
            "2times",
            "bd",
            "bid",
        )
    ):
        return "Twice daily"

    if any(
        token in compact
        for token in (
            "1-0-0",
            "0-0-1",
            "100",
            "001",
            "once",
            "od",
            "qd",
        )
    ):
        return "Once daily"

    return text


def _parse_time(value: str) -> str | None:
    value = str(value or "").strip().upper()

    match = re.search(
        r"\b(0?[1-9]|1[0-2])[:.]([0-5]\d)\s*(AM|PM)\b",
        value,
    )

    if match:
        hour = int(match.group(1))
        minute = match.group(2)
        suffix = match.group(3)

        if suffix == "PM" and hour != 12:
            hour += 12

        if suffix == "AM" and hour == 12:
            hour = 0

        return f"{hour:02d}:{minute}"

    match = re.search(
        r"\b([01]\d|2[0-3]):([0-5]\d)\b",
        value,
    )

    if match:
        return (
            f"{int(match.group(1)):02d}:"
            f"{match.group(2)}"
        )

    return None


def _normalize_result(
    data: Any,
) -> dict:
    result = _empty_result()

    if not isinstance(data, dict):
        return result

    raw_medicines = data.get(
        "medicines",
        [],
    )

    if not isinstance(
        raw_medicines,
        list,
    ):
        raw_medicines = []

    medicines = []

    for item in raw_medicines:
        if not isinstance(
            item,
            dict,
        ):
            continue

        name = str(
            item.get("medicine_name")
            or item.get("name")
            or "",
        ).strip()

        dosage = str(
            item.get("dosage")
            or "",
        ).strip()

        if not name:
            continue

        frequency = _normalize_frequency(
            item.get("frequency")
        )

        duration = str(
            item.get("duration")
            or "",
        ).strip()

        instructions = str(
            item.get("instructions")
            or item.get("instruction")
            or "",
        ).strip()

        raw_times = item.get(
            "reminder_times",
            [],
        )

        if isinstance(
            raw_times,
            str,
        ):
            raw_times = [
                part.strip()
                for part in raw_times.split(",")
                if part.strip()
            ]

        if not isinstance(
            raw_times,
            list,
        ):
            raw_times = []

        reminder_times = []

        for value in raw_times:
            parsed = _parse_time(
                str(value)
            )

            if (
                parsed
                and parsed not in reminder_times
            ):
                reminder_times.append(
                    parsed
                )

        quantity = item.get(
            "quantity"
        )

        try:
            quantity = (
                int(quantity)
                if quantity not in (
                    None,
                    "",
                )
                else None
            )
        except (
            TypeError,
            ValueError,
        ):
            quantity = None

        medicines.append(
            {
                "medicine_name": name,
                "dosage": dosage,
                "frequency": frequency,
                "duration": duration,
                "instructions": instructions,
                "reminder_times": reminder_times[:3],
                "quantity": quantity,
            }
        )

    result["medicines"] = medicines

    result["doctor_name"] = str(
        data.get("doctor_name")
        or "",
    ).strip()

    result["hospital"] = str(
        data.get("hospital")
        or "",
    ).strip()

    result["patient_name"] = str(
        data.get("patient_name")
        or "",
    ).strip()

    result["date"] = str(
        data.get("date")
        or "",
    ).strip()

    return result


def _gemini_vision_extract(
    image_bytes: bytes,
) -> dict:
    if gemini_client is None:
        raise RuntimeError(
            "The existing Gemini client from ai_service.py could not be loaded."
        )

    # Import only when this function is used.
    from google.genai import types

    prompt = """
You are MediCare AI's prescription vision extractor.

Read the uploaded prescription image directly.

This is a HANDWRITTEN prescription. Carefully read the handwriting,
medicine names, dosage, schedule and duration.

IMPORTANT:
1. Extract EVERY medicine visible in the prescription.
2. Do not stop after the first medicine.
3. Brand names are valid. Keep the visible brand name.
4. Do not replace a brand name with a generic name.
5. Do not invent information that is not visible.
6. For schedules such as:
      1-0-1 -> Twice daily
      1-1-1 -> Three times daily
      1-0-0 -> Once daily
7. Only return exact reminder clock times when an actual clock time
   is visibly written on the prescription.
8. If the prescription gives only 1-0-1 / 1-1-1 style timing,
   return reminder_times as [].
9. Extract duration such as "5 days" when visible.
10. Read the whole prescription, not just the header.

The test image may contain a prescription similar to:
- Tab. Augmentin 625 mg
- 1-0-1 x 5 days
- Tab. Enzoflam
- 1-0-1 x 5 days

Those are examples of the type of information to read, NOT values
to invent. Use only what is actually visible in the uploaded image.

Return ONLY valid JSON in exactly this structure:

{
  "medicines": [
    {
      "medicine_name": "",
      "dosage": "",
      "frequency": "",
      "duration": "",
      "instructions": "",
      "reminder_times": [],
      "quantity": null
    }
  ],
  "doctor_name": "",
  "hospital": "",
  "patient_name": "",
  "date": ""
}
"""

    response = gemini_client.models.generate_content(
        model=GEMINI_MODEL,
        contents=[
            types.Part.from_bytes(
                data=image_bytes,
                mime_type="image/jpeg",
            ),
            prompt,
        ],
    )

    text = _clean_json(
        response.text or ""
    )

    if not text:
        raise RuntimeError(
            "Gemini returned an empty prescription response."
        )

    try:
        parsed = json.loads(text)
    except json.JSONDecodeError as exc:
        raise RuntimeError(
            f"Gemini returned invalid JSON: {exc}"
        ) from exc

    result = _normalize_result(
        parsed
    )

    print(
        "✅ Gemini Vision medicines:",
        result["medicines"],
    )

    return result


def _easyocr_fallback(
    image_bytes: bytes,
) -> dict:
    """
    Lightweight fallback only if Gemini Vision fails.
    """
    try:
        import easyocr
        import numpy as np
    except ImportError as exc:
        raise RuntimeError(
            "EasyOCR is not installed."
        ) from exc

    image = Image.open(
        io.BytesIO(image_bytes)
    ).convert("RGB")

    width, height = image.size

    if width < 1600:
        scale = 1600 / max(width, 1)

        image = image.resize(
            (
                int(width * scale),
                int(height * scale),
            )
        )

    reader = easyocr.Reader(
        ["en"],
        gpu=False,
        verbose=False,
    )

    lines = reader.readtext(
        np.array(image),
        detail=0,
        paragraph=False,
        mag_ratio=1.2,
    )

    lines = [
        re.sub(
            r"\s+",
            " ",
            str(line),
        ).strip()
        for line in lines
        if str(line).strip()
    ]

    print(
        "EasyOCR fallback lines:",
        lines,
    )

    medicines = []

    dosage_pattern = re.compile(
        r"\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|iu)\b",
        re.IGNORECASE,
    )

    schedule_pattern = re.compile(
        r"(1\s*[-+]\s*0\s*[-+]\s*1|"
        r"1\s*[-+]\s*1\s*[-+]\s*1|"
        r"1\s*[-+]\s*0\s*[-+]\s*0|"
        r"twice|"
        r"three\s*times|"
        r"once)",
        re.IGNORECASE,
    )

    for index, line in enumerate(
        lines
    ):
        dose = dosage_pattern.search(
            line
        )

        schedule = schedule_pattern.search(
            line
        )

        if not dose and not schedule:
            continue

        if dose:
            name = line[
                :dose.start()
            ].strip()

            name = re.sub(
                r"^(?:rx|tab(?:let)?|cap(?:sule)?)\.?\s*",
                "",
                name,
                flags=re.IGNORECASE,
            )
        elif index > 0:
            name = lines[
                index - 1
            ]
        else:
            continue

        name = name.strip(
            " -:;,."
        )

        if len(name) < 3:
            continue

        medicines.append(
            {
                "medicine_name": name,
                "dosage": (
                    dose.group(0)
                    if dose
                    else ""
                ),
                "frequency": (
                    _normalize_frequency(
                        schedule.group(0)
                    )
                    if schedule
                    else ""
                ),
                "duration": "",
                "instructions": "",
                "reminder_times": [],
                "quantity": None,
            }
        )

    # Deduplicate.
    unique = {}
    for medicine in medicines:
        key = re.sub(
            r"[^a-z0-9]",
            "",
            medicine[
                "medicine_name"
            ].lower(),
        )

        if key not in unique:
            unique[key] = medicine

    result = _empty_result()
    result["medicines"] = list(
        unique.values()
    )

    return result


def extract_prescription(
    image_bytes: bytes,
    filename: str = "prescription",
) -> dict:
    """
    Gemini Vision first using the EXISTING working AI client,
    EasyOCR fallback second.
    """

    print("=" * 60)
    print(
        "✅ USING GEMINI VISION FOR PRESCRIPTION:",
        filename,
    )
    print("=" * 60)

    try:
        result = _gemini_vision_extract(
            image_bytes
        )

        if result["medicines"]:
            return result

        print(
            "⚠️ Gemini Vision returned no medicines; using EasyOCR fallback."
        )

    except Exception as exc:
        print(
            "Gemini Vision OCR failed:",
            repr(exc),
        )

    try:
        result = _easyocr_fallback(
            image_bytes
        )

        if result["medicines"]:
            print(
                "✅ EasyOCR fallback returned medicines:",
                result["medicines"],
            )

        return result

    except Exception as exc:
        print(
            "EasyOCR fallback failed:",
            repr(exc),
        )

        return _empty_result()
