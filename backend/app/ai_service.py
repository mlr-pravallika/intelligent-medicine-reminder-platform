from google import genai
from google.genai import errors

from app.config import GEMINI_API_KEY

client = genai.Client(
    api_key=GEMINI_API_KEY
)


# -----------------------------------
# AI Assistant Chat
# -----------------------------------

def ask_ai(question, medicines):

    medicine_data = ""

    for medicine in medicines:

        medicine_data += f"""

Medicine Name:
{medicine.medicine_name}

Dosage:
{medicine.dosage}

Frequency:
{medicine.frequency}

Reminder Time:
{medicine.reminder_time}

Instructions:
{medicine.instructions}

Remaining Quantity:
{medicine.remaining_quantity}

Total Quantity:
{medicine.total_quantity}

Tablets Per Day:
{medicine.tablets_per_day}

"""

    prompt = f"""
    You are MediCare AI.

    You are a helpful medication assistant.

    The following medicines belong to the logged-in patient.

    {medicine_data}

    The user may ask about:

    • Medicine explanation
    • Dosage
    • Side effects
    • Food interactions
    • Missed doses
    • Refill prediction
    • Reminder schedules
    • Health tips
    • Medicine safety

    User Question:

    {question}

    Rules:

    1. Use the patient's medicine list whenever relevant.
    2. If the answer depends on information not available in the medicine list, clearly say you don't have enough information instead of making something up.
    3. Keep responses concise and easy to understand.
    4. Do not diagnose diseases or prescribe treatments.
    """
    try:
        response = client.models.generate_content(
            model="gemini-flash-latest",
            contents=prompt
        )

        return response.text

    except Exception as e:
        print("Gemini Error:", e)

        return (
            "The AI service is temporarily busy. "
            "Please try again in a few seconds."
        )


# -----------------------------------
# Medicine Information
# -----------------------------------

def medicine_information(name):

    prompt = f"""
Explain the medicine.

Medicine:
{name}

Include:

• Uses
• Side Effects
• Warnings
• Storage
• Food Interaction

Keep it short.
"""

    try:
        response = client.models.generate_content(
            model="gemini-flash-latest",
            contents=prompt
        )
        return response.text
    except Exception as e:
        print("Gemini Error:", e)
        return (
            "The AI service is temporarily busy. "
            "Please try again in a few seconds."
        )


# -----------------------------------
# Daily Health Tip
# -----------------------------------

def health_tip():

    prompt = """
Give one medicine safety tip.
Maximum 40 words.
"""

    try:
        response = client.models.generate_content(
            model="gemini-flash-latest",
            contents=prompt
        )
    
        return response.text
    
    except Exception as e:
        print("Gemini Error:", e)
    
        return (
            "The AI service is temporarily busy. "
            "Please try again in a few seconds."
        )


# -----------------------------------
# Dosage Explanation
# -----------------------------------

def dosage_explanation(name, dosage):

    prompt = f"""
Explain this dosage.

Medicine:
{name}

Dosage:
{dosage}

Use simple English.
"""

    try:
        response = client.models.generate_content(
            model="gemini-flash-latest",
            contents=prompt
        )
        return response.text

    except Exception as e:
        print(e)
        return "AI service temporarily unavailable. Please try again later."


# -----------------------------------
# Refill Explanation
# -----------------------------------

def refill_reason(name, remaining, tablets):

    prompt = f"""
Medicine:
{name}

Remaining Tablets:
{remaining}

Tablets Per Day:
{tablets}

Calculate:

1. Days Left

2. Refill Date

3. Should refill soon?
"""

    try:
        response = client.models.generate_content(
            model="gemini-flash-latest",
            contents=prompt
        )
        return response.text
    except Exception as e:
        print("Gemini Error:", e)
        return "AI service temporarily unavailable. Please try again later."


# -----------------------------------
# Reminder Generator
# -----------------------------------

def reminder_text(name, time):

    prompt = f"""
Generate a friendly reminder.

Medicine:
{name}

Reminder Time:
{time}

Maximum 25 words.
"""

    try:
        response = client.models.generate_content(
            model="gemini-flash-latest",
            contents=prompt
        )
        return response.text
    except Exception as e:
        print("Gemini Error:", e)
        return "AI service temporarily unavailable. Please try again later."


# -----------------------------------
# Missed Dose Guidance
# -----------------------------------

def missed_dose(name):

    prompt = f"""
The patient missed one dose.

Medicine:
{name}

Give general guidance only.

Do not give personalized medical advice.
"""

    try:
        response = client.models.generate_content(
            model="gemini-flash-latest",
            contents=prompt
        )
        return response.text
    except Exception as e:
        print("Gemini Error:", e)
        return "AI service temporarily unavailable. Please try again later."