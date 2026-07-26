import os
import smtplib

from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from dotenv import load_dotenv

load_dotenv()

EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")


def send_email(
    receiver_email: str,
    medicine_name: str,
    dosage: str,
    reminder_time: str
):
    """
    Sends a medicine reminder email.
    """

    subject = f"Medicine Reminder - {medicine_name}"

    body = f"""
Hello,

This is your medicine reminder.

Medicine : {medicine_name}

Dosage : {dosage}

Reminder Time : {reminder_time}

Please take your medicine on time.

Stay Healthy!

Intelligent Medicine Reminder Platform
"""

    message = MIMEMultipart()

    message["From"] = EMAIL_ADDRESS
    message["To"] = receiver_email
    message["Subject"] = subject

    message.attach(MIMEText(body, "plain"))

    try:

        server = smtplib.SMTP("smtp.gmail.com", 587)

        server.starttls()

        server.login(
            EMAIL_ADDRESS,
            EMAIL_PASSWORD
        )

        server.sendmail(
            EMAIL_ADDRESS,
            receiver_email,
            message.as_string()
        )

        server.quit()

        print("📧 Email sent successfully!")

    except Exception as e:

        print("❌ Email Error")

        print(e)