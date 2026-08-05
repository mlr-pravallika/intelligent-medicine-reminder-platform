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

    subject = f"MediCare AI | Reminder | {medicine_name}"

    html = f"""
    <html>

    <body style="background:#f4f8fb;
    font-family:Arial,sans-serif;
    padding:30px;">

    <div style="
    max-width:650px;
    margin:auto;
    background:white;
    border-radius:16px;
    padding:35px;
    box-shadow:0 10px 30px rgba(0,0,0,.08);
    ">

    <h1 style="color:#0077ff;">
    💊 MediCare AI
    </h1>

    <p style="color:#666;">
    Medication Intelligence Platform
    </p>

    <hr>

    <h2 style="color:#1f2937;">
    Medicine Reminder
    </h2>

    <p>
    Hello <b>{receiver_email}</b>,
    </p>

    <p>
    It's time to take your medicine.
    Please don't skip today's dose.
    </p>

    <table
    style="
    width:100%;
    margin-top:20px;
    border-collapse:collapse;
    ">

    <tr>

    <td style="padding:14px;">
    💊
    </td>

    <td>

    <b>Medicine</b><br>

    {medicine_name}

    </td>

    </tr>

    <tr>

    <td style="padding:14px;">
    💉
    </td>

    <td>

    <b>Dosage</b><br>

    {dosage}

    </td>

    </tr>

    <tr>

    <td style="padding:14px;">
    ⏰
    </td>

    <td>

    <b>Reminder Time</b><br>

    {reminder_time}

    </td>

    </tr>

    </table>

    <br>

    <div
    style="
    background:#edf8ff;
    padding:15px;
    border-left:5px solid #0ea5e9;
    border-radius:8px;
    ">

    ⚠️ Missing medicines may affect your treatment.

    </div>

    <br>

    <a
    href="http://localhost:8080/patient"
    style="
    background:#0ea5e9;
    padding:14px 24px;
    color:white;
    text-decoration:none;
    border-radius:8px;
    font-weight:bold;
    display:inline-block;
    ">

    Open MediCare AI Dashboard

    </a>

    <br><br>

    <hr>

    <p style="color:#888;font-size:13px;">

    This reminder was generated automatically by
    <b>MediCare AI</b>.

    <br>

    Stay Healthy ❤️

    </p>

    </div>

    </body>

    </html>
    """

    message = MIMEMultipart()

    message["From"] = f"MediCare AI <{EMAIL_ADDRESS}>"
    message["To"] = receiver_email
    message["Subject"] = subject

    message.attach(MIMEText(html, "html"))

    try:
        print("Connecting to Gmail SMTP...")

        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()

        print("Logging in...")

        print("Sender:", EMAIL_ADDRESS)
        print("Receiver:", receiver_email)

        server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)

        print("Sending email to:", receiver_email)

        server.sendmail(
            EMAIL_ADDRESS,
            receiver_email,
            message.as_string()
        )

        print(message.as_string())

        server.quit()

        print("Email sent successfully!")

    except Exception as e:
        print("EMAIL ERROR:")
        print(type(e).__name__)
        print(str(e))