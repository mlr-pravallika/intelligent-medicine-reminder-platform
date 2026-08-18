
"""
MediCare AI service.

This file keeps the existing public functions used by the application,
but makes Gemini calls more reliable and keeps assistant responses clean.

Primary model:
    gemini-3.6-flash

Fallback model:
    gemini-3.5-flash-lite

Both are stable Gemini API model IDs. The assistant uses the logged-in
patient's medication records supplied by the route.
"""

import json
import re
import time
from typing import Any

from google import genai

from app.config import GEMINI_API_KEY


if not GEMINI_API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY is not configured. "
        "Add it to backend/.env and restart FastAPI."
    )


client = genai.Client(
    api_key=GEMINI_API_KEY,
)


GENERAL_MODEL = "gemini-3.6-flash"
FAST_MODEL = "gemini-3.5-flash-lite"


def _clean_ai_text(value: Any) -> str:
    """
    Convert Gemini output into clean readable plain text.

    We remove markdown/code formatting because the frontend assistant
    is intentionally a simple conversational text UI.
    """
    text = str(value or "").strip()

    text = re.sub(
        r"```[\s\S]*?```",
        "",
        text,
    )

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

    text = re.sub(
        r"https?://\S+",
        "",
        text,
        flags=re.IGNORECASE,
    )

    text = re.sub(
        r"[*_`#~>|]+",
        "",
        text,
    )

    text = re.sub(
        r"^\s*[-•]\s+",
        "",
        text,
        flags=re.MULTILINE,
    )

    text = re.sub(
        r"\s+([,.;!?])",
        r"\1",
        text,
    )

    text = re.sub(
        r"[ \t]+",
        " ",
        text,
    )

    text = re.sub(
        r"\n{3,}",
        "\n\n",
        text,
    )

    return text.strip()


def _generate(
    prompt: str,
    *,
    models: list[str] | None = None,
    max_retries: int = 2,
) -> str:
    """
    Generate text with a small retry policy.

    We deliberately avoid long exponential waiting because the patient
    assistant is an interactive page.
    """
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
            max_retries,
        ):
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
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

                error_text = (
                    str(exc).lower()
                )

                retryable = (
                    "429" in error_text
                    or "500" in error_text
                    or "502" in error_text
                    or "503" in error_text
                    or "504" in error_text
                    or "unavailable" in error_text
                    or "resource_exhausted"
                    in error_text
                    or "high demand"
                    in error_text
                    or "deadline" in error_text
                    or "timeout" in error_text
                )

                print(
                    "Gemini error "
                    f"(model={model_name}, "
                    f"attempt={attempt + 1}): "
                    f"{exc}"
                )

                if (
                    not retryable
                    or attempt >=
                    max_retries - 1
                ):
                    break

                time.sleep(
                    1.0
                )

    raise RuntimeError(
        f"Gemini request failed: {last_error}"
    )


def _medicine_context(
    medicines,
) -> str:
    if not medicines:
        return (
            "No medicines are currently registered "
            "for this patient."
        )

    blocks = []

    for medicine in medicines:
        blocks.append(
            (
                f"Medicine: {medicine.medicine_name}\n"
                f"Dosage: {medicine.dosage}\n"
                f"Frequency: {medicine.frequency}\n"
                f"Reminder times: {medicine.reminder_time}\n"
                f"Instructions: {medicine.instructions or 'Not recorded'}\n"
                f"Remaining quantity: {medicine.remaining_quantity}\n"
                f"Total quantity: {medicine.total_quantity}\n"
                f"Tablets per day: {medicine.tablets_per_day}\n"
                f"Start date: {medicine.start_date}\n"
                f"End date: {medicine.end_date}"
            )
        )

    return "\n\n".join(
        blocks
    )


def _local_assistant_fallback(
    question: str,
    medicines,
) -> str | None:
    """
    Useful deterministic answers for common questions.

    This keeps the assistant useful even when Gemini is temporarily
    unavailable and never pretends that an unavailable AI call succeeded.
    """
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
            f"You currently have {len(medicines)} "
            "registered medicines."
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
            + "\n".join(
                lines
            )
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
            + "\n".join(
                lines
            )
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

    local_answer = _local_assistant_fallback(
        question,
        medicines,
    )

    if local_answer is not None:
        # Common account/data questions do not need a model call.
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

Instructions:

Answer the user's question using the patient's recorded medication
information when it is relevant.

Use simple, professional English.

Keep the answer concise and easy to read.

Do not use markdown headings, markdown bullets, tables, emojis,
asterisks, backticks, or special formatting characters.

Use short plain-text paragraphs.

Do not diagnose diseases.

Do not prescribe new medicines.

Do not change a patient's recorded dosage or treatment plan.

Do not invent information that is missing from the patient's records.

For questions about missed doses, say that the patient should follow
the instructions on their prescription or contact their doctor or
pharmacist when the correct action is not known from the records.

For medicine safety questions, provide general information and clearly
state when professional medical advice is needed.
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

        # Do not hide the real situation behind a vague success-looking
        # response. Return a clear temporary-service message.
        return (
            "The AI assistant is temporarily unavailable. "
            "Your saved medicine data is still available. "
            "Please try the question again in a moment."
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
Determine whether this is a real medicine, pharmaceutical drug,
or recognized medicine brand.

Medicine name:
{medicine_name}

Rules:
Generic names are valid.
Brand names are valid.
Indian and international medicine brands are valid.
Reject random text, foods, symptoms, diseases, names or nonsense.
Do not invent a medicine.
Do not recommend treatment.
Do not determine dosage.

Return only JSON:

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
            max_retries=1,
        )

        cleaned = re.sub(
            r"^```(?:json)?\s*",
            "",
            raw,
            flags=re.IGNORECASE,
        )

        cleaned = re.sub(
            r"\s*```$",
            "",
            cleaned,
        )

        parsed = json.loads(
            cleaned
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
                    "Medicine recognized."
                    if valid
                    else "The entered name was not recognized as a medicine.",
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

        return {
            "valid": False,
            "available": False,
            "medicine_name": medicine_name,
            "message": (
                "AI medicine verification is temporarily unavailable."
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
Use plain text without markdown.
"""

    try:
        return _generate(
            prompt,
            models=[
                GENERAL_MODEL,
                FAST_MODEL,
            ],
            max_retries=1,
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
            max_retries=1,
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
            max_retries=1,
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
            max_retries=1,
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
            max_retries=1,
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
            max_retries=1,
        )
    except Exception:
        return (
            "Follow the missed-dose instructions on your prescription "
            "or contact your doctor or pharmacist if you are unsure."
        )
