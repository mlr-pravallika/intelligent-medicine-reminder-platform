"""
MediCare AI service.

Gemini configuration:
Primary  : gemini-3.6-flash
Fallback : gemini-3.5-flash-lite

The service is designed to:
- retry temporary Gemini failures
- automatically fall back to another model
- keep assistant responses clean
- keep medicine validation usable when Gemini is temporarily unavailable
"""

import json
import re
import time
from typing import Any

from google import genai

from app.config import GEMINI_API_KEY


# ============================================================
# CONFIGURATION
# ============================================================

if not GEMINI_API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY is not configured. "
        "Add it to the backend environment."
    )


client = genai.Client(
    api_key=GEMINI_API_KEY,
)


GENERAL_MODEL = "gemini-3.6-flash"
FAST_MODEL = "gemini-3.5-flash-lite"


# ============================================================
# TEXT CLEANING
# ============================================================

def _clean_ai_text(value: Any) -> str:
    text = str(value or "").strip()

    if not text:
        return ""

    # Remove fenced code blocks.
    text = re.sub(
        r"```[\s\S]*?```",
        "",
        text,
    )

    # Remove markdown links but keep visible text.
    text = re.sub(
        r"!\[([^\]]*)\]\([^)]+\)",
        r"\1",
        text,
    )

    text = re.sub(
        r"\[([^\]]+)\]\([^)]+\)",
        r"\1",
        text,
    )

    # Remove URLs.
    text = re.sub(
        r"https?://\S+",
        "",
        text,
        flags=re.IGNORECASE,
    )

    # Remove common markdown symbols.
    text = re.sub(
        r"[*_`#~>|]+",
        "",
        text,
    )

    # Remove bullet prefix.
    text = re.sub(
        r"^\s*[-•]\s+",
        "",
        text,
        flags=re.MULTILINE,
    )

    # Normalize spaces.
    text = re.sub(
        r"[ \t]+",
        " ",
        text,
    )

    text = re.sub(
        r"\s+([,.;!?])",
        r"\1",
        text,
    )

    text = re.sub(
        r"\n{3,}",
        "\n\n",
        text,
    )

    return text.strip()


# ============================================================
# JSON EXTRACTION
# ============================================================

def _extract_json(value: str) -> dict:
    """
    Extract a JSON object even if Gemini surrounds it with
    extra whitespace, code fences, or explanation.
    """

    text = str(value or "").strip()

    if not text:
        raise ValueError(
            "Empty Gemini response."
        )

    # Remove fenced JSON.
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

    text = text.strip()

    # First try direct parsing.
    try:
        parsed = json.loads(text)

        if isinstance(parsed, dict):
            return parsed

    except json.JSONDecodeError:
        pass

    # Try to locate the first JSON object.
    start = text.find("{")
    end = text.rfind("}")

    if start == -1 or end == -1 or end <= start:
        raise ValueError(
            "Gemini response did not contain valid JSON."
        )

    candidate = text[start : end + 1]

    parsed = json.loads(candidate)

    if not isinstance(parsed, dict):
        raise ValueError(
            "Gemini JSON response was not an object."
        )

    return parsed


# ============================================================
# GEMINI GENERATION
# ============================================================

def _is_retryable_error(
    error_text: str,
) -> bool:
    text = error_text.lower()

    retry_keywords = (
        "429",
        "500",
        "502",
        "503",
        "504",
        "unavailable",
        "resource_exhausted",
        "high demand",
        "timeout",
        "timed out",
        "deadline",
        "temporarily",
        "overloaded",
    )

    return any(
        keyword in text
        for keyword in retry_keywords
    )


def _is_model_not_found_error(
    error_text: str,
) -> bool:
    text = error_text.lower()

    return (
        "404" in text
        or "not_found" in text
        or "model" in text
        and "not found" in text
    )


def _generate(
    prompt: str,
    *,
    models: list[str] | None = None,
    max_retries: int = 2,
) -> str:

    model_list = (
        models
        if models
        else [
            GENERAL_MODEL,
            FAST_MODEL,
        ]
    )

    last_error: Exception | None = None

    for model_name in model_list:

        for attempt in range(
            max_retries
        ):

            try:
                response = (
                    client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                    )
                )

                text = _clean_ai_text(
                    getattr(
                        response,
                        "text",
                        "",
                    )
                )

                if text:
                    print(
                        f"Gemini success: {model_name}"
                    )

                    return text

                raise RuntimeError(
                    "Gemini returned an empty response."
                )

            except Exception as exc:

                last_error = exc

                error_text = str(
                    exc
                ).lower()

                print(
                    "Gemini error "
                    f"(model={model_name}, "
                    f"attempt={attempt + 1}): "
                    f"{exc}"
                )

                # If model itself is invalid,
                # immediately move to fallback.
                if _is_model_not_found_error(
                    error_text
                ):
                    break

                # Temporary service problem.
                if _is_retryable_error(
                    error_text
                ):
                    if (
                        attempt
                        < max_retries - 1
                    ):
                        time.sleep(
                            1.5 * (attempt + 1)
                        )

                    continue

                # Non-retryable error:
                # move directly to next model.
                break

    raise RuntimeError(
        f"Gemini request failed: {last_error}"
    )


# ============================================================
# MEDICINE CONTEXT
# ============================================================

def _medicine_context(
    medicines,
) -> str:

    if not medicines:
        return (
            "No medicines are currently registered "
            "for this patient."
        )

    blocks: list[str] = []

    for medicine in medicines:

        blocks.append(
            (
                f"Medicine: {medicine.medicine_name}\n"
                f"Dosage: {medicine.dosage}\n"
                f"Frequency: {medicine.frequency}\n"
                f"Reminder times: {medicine.reminder_time}\n"
                f"Instructions: "
                f"{medicine.instructions or 'Not recorded'}\n"
                f"Remaining quantity: "
                f"{medicine.remaining_quantity}\n"
                f"Total quantity: "
                f"{medicine.total_quantity}\n"
                f"Tablets per day: "
                f"{medicine.tablets_per_day}\n"
                f"Start date: {medicine.start_date}\n"
                f"End date: {medicine.end_date}"
            )
        )

    return "\n\n".join(
        blocks
    )


# ============================================================
# LOCAL ASSISTANT FALLBACK
# ============================================================

def _local_assistant_fallback(
    question: str,
    medicines,
) -> str | None:

    q = question.strip().lower()

    if not medicines:

        if (
            "medicine" in q
            or "medication" in q
            or "taking" in q
        ):
            return (
                "You do not have any medicines registered "
                "in your MediCare AI account yet."
            )

        return None

    if (
        "how many medicines" in q
        or "number of medicines" in q
        or (
            "medicines" in q
            and "list" not in q
            and "schedule" not in q
            and "dosage" not in q
        )
    ):
        return (
            f"You currently have "
            f"{len(medicines)} registered medicines."
        )

    if (
        "list" in q
        and (
            "medicine" in q
            or "medication" in q
        )
    ):
        names = [
            medicine.medicine_name
            for medicine in medicines
        ]

        return (
            "Your registered medicines are:\n"
            + "\n".join(
                f"{index + 1}. {name}"
                for index, name in enumerate(
                    names
                )
            )
        )

    if (
        "schedule" in q
        or "reminder" in q
        or "timing" in q
        or "time" in q
    ):
        lines = []

        for medicine in medicines:
            lines.append(
                f"{medicine.medicine_name}: "
                f"{medicine.reminder_time}"
            )

        return (
            "Your current reminder schedule is:\n"
            + "\n".join(lines)
        )

    if (
        "remaining" in q
        or "stock" in q
        or "tablets left" in q
    ):
        lines = []

        for medicine in medicines:
            lines.append(
                f"{medicine.medicine_name}: "
                f"{medicine.remaining_quantity} "
                "tablets remaining"
            )

        return (
            "Your current medicine quantities are:\n"
            + "\n".join(lines)
        )

    return None


# ============================================================
# AI ASSISTANT
# ============================================================

def ask_ai(
    question,
    medicines,
):

    question = str(
        question or ""
    ).strip()

    if not question:
        return (
            "Please enter a question about your medicines, "
            "reminders, dosage or medication history."
        )

    local_answer = (
        _local_assistant_fallback(
            question,
            medicines,
        )
    )

    if local_answer is not None:
        return _clean_ai_text(
            local_answer
        )

    medicine_data = _medicine_context(
        medicines
    )

    prompt = f"""
You are MediCare AI, a medication information assistant.

Patient medication records:

{medicine_data}

User question:

{question}

Rules:

Answer using the patient's recorded medication information when relevant.

Use simple professional English.

Keep the answer concise.

Do not use markdown headings, markdown bullets, tables, emojis,
asterisks, backticks, or special formatting characters.

Use short plain-text paragraphs.

Do not diagnose diseases.

Do not prescribe new medicines.

Do not change the recorded dosage or treatment plan.

Do not invent information.

For missed-dose questions, follow the prescription or advise the user
to contact a doctor or pharmacist when the correct action is not known
from the records.

For safety questions, provide general information and state when
professional medical advice is needed.
"""

    try:

        return _generate(
            prompt,
            models=[
                GENERAL_MODEL,
                FAST_MODEL,
            ],
            max_retries=2,
        )

    except Exception as exc:

        print(
            "AI Assistant error:",
            repr(exc),
        )

        return (
            "The AI assistant is temporarily unavailable. "
            "Your saved medicine data is still available. "
            "Please try again shortly."
        )


# ============================================================
# MEDICINE NAME VALIDATION
# ============================================================

def validate_medicine_name(
    name: str,
) -> dict:

    medicine_name = (
        name or ""
    ).strip()

    if not medicine_name:

        return {
            "valid": False,
            "available": True,
            "medicine_name": "",
            "message": (
                "Please enter a medicine name."
            ),
            "suggestion": None,
        }

    prompt = f"""
Determine whether the following is a real medicine,
pharmaceutical drug, or recognized medicine brand.

Medicine name:
{medicine_name}

Rules:
Generic names are valid.
Brand names are valid.
Indian and international medicine brands are valid.
Do not reject a valid brand merely because it is not a generic name.
Reject random text, food names, symptoms, diseases, person names,
or obvious nonsense.
Do not recommend treatment.
Do not determine dosage.

Return ONLY a JSON object in exactly this form:

{{
  "valid": true,
  "message": "Medicine recognized.",
  "suggestion": null
}}
"""

    try:

        raw = _generate(
            prompt,
            models=[
                FAST_MODEL,
                GENERAL_MODEL,
            ],
            max_retries=2,
        )

        parsed = _extract_json(
            raw
        )

        valid = bool(
            parsed.get(
                "valid",
                False,
            )
        )

        return {
            "valid": valid,
            "available": True,
            "medicine_name": medicine_name,
            "message": str(
                parsed.get(
                    "message",
                    (
                        "Medicine recognized."
                        if valid
                        else
                        "The entered name was not recognized as a medicine."
                    ),
                )
            ),
            "suggestion": parsed.get(
                "suggestion"
            ),
        }

    except Exception as exc:

        print(
            "Medicine validation unavailable:",
            repr(exc),
        )

        # Important:
        # Gemini being temporarily unavailable
        # must NOT block adding a medicine.
        return {
            "valid": True,
            "available": False,
            "medicine_name": medicine_name,
            "message": (
                "AI verification is temporarily unavailable. "
                "You can continue after reviewing the medicine name."
            ),
            "suggestion": None,
        }


# ============================================================
# OTHER AI HELPERS
# ============================================================

def medicine_information(
    name,
):
    prompt = f"""
Give brief general information about this medicine:

{name}

Include:
Common uses
Common side effects
Important warnings
Storage
Food interactions

Do not prescribe dosage.
Do not diagnose.
Use plain text only.
"""

    try:
        return _generate(
            prompt,
            models=[
                GENERAL_MODEL,
                FAST_MODEL,
            ],
            max_retries=2,
        )

    except Exception:
        return (
            "The AI service is temporarily unavailable."
        )


def health_tip():

    prompt = """
Give one general medicine safety tip in no more than 40 words.
Use plain text only.
"""

    try:
        return _generate(
            prompt,
            models=[
                FAST_MODEL,
                GENERAL_MODEL,
            ],
            max_retries=2,
        )

    except Exception:
        return (
            "Take medicines only according to the instructions "
            "provided by your doctor or pharmacist."
        )


def dosage_explanation(
    name,
    dosage,
):

    prompt = f"""
Explain this recorded dosage in simple English.

Medicine: {name}
Recorded dosage: {dosage}

Do not change the dosage.
Use plain text only.
"""

    try:
        return _generate(
            prompt,
            models=[
                FAST_MODEL,
                GENERAL_MODEL,
            ],
            max_retries=2,
        )

    except Exception:
        return (
            "The AI service is temporarily unavailable."
        )


def refill_reason(
    name,
    remaining,
    tablets,
):

    prompt = f"""
Medicine: {name}
Remaining tablets: {remaining}
Tablets per day: {tablets}

Give:
Approximate days remaining.
Approximate refill date.
Whether the supply is low.

Use plain text only.
"""

    try:
        return _generate(
            prompt,
            models=[
                FAST_MODEL,
                GENERAL_MODEL,
            ],
            max_retries=2,
        )

    except Exception:
        return (
            "The AI service is temporarily unavailable."
        )


def reminder_text(
    name,
    time,
):

    prompt = f"""
Write a friendly medicine reminder.

Medicine: {name}
Reminder time: {time}

Maximum 25 words.
Plain text only.
"""

    try:
        return _generate(
            prompt,
            models=[
                FAST_MODEL,
                GENERAL_MODEL,
            ],
            max_retries=2,
        )

    except Exception:
        return (
            f"Reminder: take {name} at {time} "
            "according to your prescription."
        )


def missed_dose(
    name,
):

    prompt = f"""
The patient says they missed a dose of {name}.

Give general safety guidance only.
Do not tell them to double the next dose.
Do not change treatment.
Use plain text only.
"""

    try:
        return _generate(
            prompt,
            models=[
                GENERAL_MODEL,
                FAST_MODEL,
            ],
            max_retries=2,
        )

    except Exception:
        return (
            "Follow the missed-dose instructions on your prescription "
            "or contact your doctor or pharmacist if you are unsure."
        )