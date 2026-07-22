from apscheduler.schedulers.background import BackgroundScheduler

from datetime import datetime

from .database import SessionLocal

from .models import Medicine, ReminderHistory

from .email_service import send_email

from .sms_service import send_sms

def check_medicines():

    print("Checking medicines...")

    db = SessionLocal()

    try:

        medicines = (
            db.query(Medicine)
            .filter(Medicine.is_active == True)
            .all()
        )

        print(f"Found {len(medicines)} medicines")

        current_time = datetime.now().strftime("%I:%M %p")

        print("Current Time:", current_time)

        for medicine in medicines:

            print(
                medicine.medicine_name,
                "Reminder:",
                medicine.reminder_time
            )

            print(
                f"Comparing Current='{current_time}' with Reminder='{medicine.reminder_time}'"
            )

            print(
                "Medicine:",
                medicine.medicine_name,
                "| Active:",
                medicine.is_active
            )

            if current_time.strip() == medicine.reminder_time.strip():

                print("✅ Time Matched")

                print("=" * 50)
                print("🔔 REMINDER")
                print("Medicine :", medicine.medicine_name)
                print("Dosage   :", medicine.dosage)
                print("Time     :", medicine.reminder_time)
                print("=" * 50)

                status = "Sent"

                try:
                    send_email(
                        receiver_email=medicine.user.email,
                        medicine_name=medicine.medicine_name,
                        dosage=medicine.dosage,
                        reminder_time=medicine.reminder_time
                    )
                except Exception:
                    status = "Email Failed"

                try:
                    send_sms(
                        receiver_phone=medicine.user.phone,
                        message=(
                            f"Medicine: {medicine.medicine_name}\n"
                            f"Dosage: {medicine.dosage}\n"
                            f"Time: {medicine.reminder_time}"
                        )
                    )
                except Exception:
                    status = "SMS Failed"

                history = ReminderHistory(
                    user_id=medicine.user.id,
                    medicine_name=medicine.medicine_name,
                    dosage=medicine.dosage,
                    reminder_time=medicine.reminder_time,
                    status=status
                )              

                db.add(history)
                db.commit()

    finally:

        db.close()

scheduler = BackgroundScheduler()

scheduler.add_job(
    check_medicines,
    "interval",
    minutes=1
)


def start_scheduler():
    if not scheduler.running:
        scheduler.start()
        print("✅ Scheduler Started")        