import os
import smtplib

from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from dotenv import load_dotenv


load_dotenv()


EMAIL_ADDRESS = os.getenv(
    "EMAIL_ADDRESS",
    "",
).strip()

EMAIL_PASSWORD = os.getenv(
    "EMAIL_PASSWORD",
    "",
).strip()


SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587


def _validate_email_config() -> None:
    if not EMAIL_ADDRESS:
        raise RuntimeError(
            "EMAIL_ADDRESS is not configured."
        )

    if not EMAIL_PASSWORD:
        raise RuntimeError(
            "EMAIL_PASSWORD is not configured."
        )


def _send_html_email(
    receiver_email: str,
    subject: str,
    html: str,
) -> bool:

    _validate_email_config()

    message = MIMEMultipart("alternative")

    message["From"] = (
        f"MediCare AI <{EMAIL_ADDRESS}>"
    )

    message["To"] = receiver_email
    message["Subject"] = subject

    message.attach(
        MIMEText(
            html,
            "html",
            "utf-8",
        )
    )

    server = None

    try:
        print(
            "Connecting to Gmail SMTP..."
        )

        server = smtplib.SMTP(
            SMTP_HOST,
            SMTP_PORT,
            timeout=30,
        )

        server.ehlo()

        server.starttls()

        server.ehlo()

        print(
            "Logging into Gmail..."
        )

        server.login(
            EMAIL_ADDRESS,
            EMAIL_PASSWORD,
        )

        print(
            f"Sending email to {receiver_email}..."
        )

        server.sendmail(
            EMAIL_ADDRESS,
            [receiver_email],
            message.as_string(),
        )

        print(
            f"Email sent successfully to {receiver_email}"
        )

        return True

    except Exception as exc:
        print(
            "EMAIL ERROR:",
            type(exc).__name__,
            str(exc),
        )

        return False

    finally:
        if server is not None:
            try:
                server.quit()
            except Exception:
                pass


def send_email(
    receiver_email: str,
    medicine_name: str,
    dosage: str,
    reminder_time: str,
) -> bool:

    subject = (
        f"MediCare AI | Medicine Reminder | "
        f"{medicine_name}"
    )

    html = f"""
    <html>
    <body style="
        background:#f4f8fb;
        font-family:Arial,sans-serif;
        padding:30px;
    ">

    <div style="
        max-width:650px;
        margin:auto;
        background:white;
        border-radius:16px;
        padding:35px;
        box-shadow:0 10px 30px rgba(0,0,0,.08);
    ">

        <h1 style="color:#0077ff;">
            MediCare AI
        </h1>

        <p style="color:#666;">
            Medication Intelligence Platform
        </p>

        <hr>

        <h2 style="color:#1f2937;">
            Medicine Reminder
        </h2>

        <p>
            Hello,
        </p>

        <p>
            It is time to take your medicine.
        </p>

        <table style="
            width:100%;
            margin-top:20px;
            border-collapse:collapse;
        ">

            <tr>
                <td style="padding:12px;">
                    <b>Medicine</b>
                </td>

                <td style="padding:12px;">
                    {medicine_name}
                </td>
            </tr>

            <tr>
                <td style="padding:12px;">
                    <b>Dosage</b>
                </td>

                <td style="padding:12px;">
                    {dosage}
                </td>
            </tr>

            <tr>
                <td style="padding:12px;">
                    <b>Reminder Time</b>
                </td>

                <td style="padding:12px;">
                    {reminder_time}
                </td>
            </tr>

        </table>

        <div style="
            margin-top:20px;
            background:#edf8ff;
            padding:15px;
            border-left:5px solid #0ea5e9;
            border-radius:8px;
        ">
            Please follow the medication instructions
            provided by your healthcare professional.
        </div>

        <hr style="margin-top:25px;">

        <p style="
            color:#888;
            font-size:13px;
        ">
            This reminder was generated automatically
            by MediCare AI.
        </p>

    </div>

    </body>
    </html>
    """

    return _send_html_email(
        receiver_email=receiver_email,
        subject=subject,
        html=html,
    )


def send_verification_code_email(
    receiver_email: str,
    verification_code: str,
) -> bool:

    subject = (
        "MediCare AI | Password Reset Verification Code"
    )

    html = f"""
    <html>
    <body style="
        background:#f4f8fb;
        font-family:Arial,sans-serif;
        padding:30px;
    ">

    <div style="
        max-width:600px;
        margin:auto;
        background:white;
        border-radius:16px;
        padding:35px;
    ">

        <h1 style="color:#0077ff;">
            MediCare AI
        </h1>

        <h2>
            Password Reset Verification
        </h2>

        <p>
            Your verification code is:
        </p>

        <div style="
            margin:25px 0;
            padding:20px;
            text-align:center;
            background:#eff6ff;
            border-radius:12px;
        ">

            <span style="
                font-size:34px;
                font-weight:bold;
                letter-spacing:8px;
                color:#2563eb;
            ">
                {verification_code}
            </span>

        </div>

        <p>
            This code expires in 10 minutes.
        </p>

        <p style="color:#dc2626;">
            Do not share this code with anyone.
        </p>

    </div>

    </body>
    </html>
    """

    return _send_html_email(
        receiver_email=receiver_email,
        subject=subject,
        html=html,
    )


def send_password_reset_success_email(
    receiver_email: str,
) -> bool:

    subject = (
        "MediCare AI | Password Changed Successfully"
    )

    html = """
    <html>
    <body style="
        font-family:Arial,sans-serif;
        padding:30px;
    ">

    <div style="
        max-width:600px;
        margin:auto;
        padding:35px;
        background:white;
        border-radius:16px;
    ">

        <h1 style="color:#0077ff;">
            MediCare AI
        </h1>

        <h2>
            Password changed successfully
        </h2>

        <p>
            Your MediCare AI account password was
            successfully changed.
        </p>

    </div>

    </body>
    </html>
    """

    return _send_html_email(
        receiver_email=receiver_email,
        subject=subject,
        html=html,
    )