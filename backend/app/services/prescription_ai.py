import json
import re
import time
from PIL import Image
from google import genai

from app.config import GEMINI_API_KEY

client = genai.Client(api_key=GEMINI_API_KEY)


def extract_prescription(image_path: str):

    image = Image.open(image_path)

    prompt = """
You are an expert medical prescription reader.

Analyze the prescription image carefully.

Extract EVERY medicine written on the prescription.

IMPORTANT:

- Do NOT stop after the first medicine.
- Return ALL medicines in the order they appear.
- Include doctor name.
- Include hospital name.
- Include patient name.
- Include date.

Return ONLY valid JSON.

Example:

{
    "doctor_name":"",
    "hospital":"",
    "patient_name":"",
    "date":"",
    "medicines":[
        {
            "medicine_name":"",
            "dosage":"",
            "frequency":"",
            "duration":"",
            "instructions":""
        }
    ]
}

Rules:

1. Detect every medicine.
2. Never invent information.
3. Empty string if unknown.
4. JSON only.
"""

    response = None

    # Retry Gemini 3 times
    for attempt in range(3):

        try:

            response = client.models.generate_content(
                model="gemini-flash-latest",
                contents=[
                    image,
                    prompt
                ]
            )

            break

        except Exception as e:

            print(f"Gemini Attempt {attempt+1} Failed")
            print(e)

            if attempt < 2:
                time.sleep(5)

    if response is None:
        raise Exception("Gemini unavailable")

    text = response.text.strip()

    print("Gemini Response:")
    print(text)

    match = re.search(r"\{.*\}", text, re.DOTALL)

    if not match:
        raise Exception("Gemini did not return valid JSON")

    result = json.loads(match.group())

    # Clean medicine names
    for medicine in result.get("medicines", []):

        medicine["medicine_name"] = (
            medicine.get("medicine_name", "")
            .replace("Tab.", "")
            .replace("Tab", "")
            .replace("Tablet", "")
            .replace("Cap.", "")
            .replace("Capsule", "")
            .strip()
        )

    return result