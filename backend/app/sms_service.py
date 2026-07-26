import os

from dotenv import load_dotenv
from twilio.rest import Client

load_dotenv()

ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
MESSAGING_SERVICE_SID = os.getenv("TWILIO_MESSAGING_SERVICE_SID")

client = Client(ACCOUNT_SID, AUTH_TOKEN)


def send_sms(receiver_phone: str, message: str):
    try:
        client.messages.create(
            messaging_service_sid=MESSAGING_SERVICE_SID,
            body=message,
            to=receiver_phone,
        )

        print("📱 SMS sent successfully!")

    except Exception as e:
        print("SMS Error:", e)