from google import genai
from app.config import GEMINI_API_KEY

client = genai.Client(api_key=GEMINI_API_KEY)


def ask_gemini(prompt: str):

    response = client.models.generate_content(
        model="gemini-flash-latest",
        contents=prompt
    )

    return response.text