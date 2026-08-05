from google.oauth2 import id_token
from google.auth.transport import requests
from app.config import GOOGLE_CLIENT_ID

GOOGLE_CLIENT_ID = "528927902048-2c397hc0iau261d3f6u6pulkpd8b5t5u.apps.googleusercontent.com"

def verify_google_token(token: str):

    user_info = id_token.verify_oauth2_token(
        token,
        requests.Request(),
        GOOGLE_CLIENT_ID
    )

    return user_info