import os
from dotenv import load_dotenv
from twilio.rest import Client

load_dotenv()

ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
MESSAGING_SERVICE_SID = os.getenv("TWILIO_MESSAGING_SERVICE_SID")

client = Client(ACCOUNT_SID, AUTH_TOKEN)


def send_sms(phone, name, medicine, dosage, reminder_time):
    try:

        print("========== SMS ==========")
        print("Receiver :", phone)

        message = f"""
💊 MediCare AI Reminder

Hello {name},

It's time to take your medicine.

Medicine : {medicine}
Dosage   : {dosage}
Time     : {reminder_time}

Please take your medicine as prescribed.

Stay Healthy!

MediCare AI
"""

        msg = client.messages.create(
            messaging_service_sid=MESSAGING_SERVICE_SID,
            body=message,
            to=f"+91{phone}"
        )

        print("SMS SID :", msg.sid)
        print("SMS Status :", msg.status)
        print("=========================")

    except Exception as e:
        print("SMS ERROR")
        print(e)