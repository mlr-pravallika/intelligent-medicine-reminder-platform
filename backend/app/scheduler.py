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

        current_time = datetime.now().strftime("%H:%M")
        print("Current Time:", current_time)

        for medicine in medicines:
            print(repr(medicine.reminder_time))

            if current_time == medicine.reminder_time:
                print("✅ Time Matched")

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
            existing = (
                db.query(ReminderHistory)
                .filter(
                    ReminderHistory.user_id == medicine.user.id,
                    ReminderHistory.medicine_name == medicine.medicine_name,
                    ReminderHistory.reminder_time == medicine.reminder_time,
                )
                .order_by(ReminderHistory.sent_at.desc())
                .first()
            )

            if existing:
                continue

            if current_time.strip() == medicine.reminder_time.strip():

                status = "Sent"

                # ----------------------------------
                # Reduce remaining stock
                # ----------------------------------

                if medicine.remaining_quantity is None:
                    medicine.remaining_quantity = medicine.total_quantity

                if medicine.tablets_per_day is None:
                    medicine.tablets_per_day = 1

                medicine.remaining_quantity -= medicine.tablets_per_day

                if medicine.remaining_quantity < 0:
                    medicine.remaining_quantity = 0

                db.commit()

                print(
                    f"{medicine.medicine_name} Remaining: "
                    f"{medicine.remaining_quantity}"
                )

                print("✅ Time Matched")

                print(repr(medicine.reminder_time))

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
                db.refresh(history)

                print("✅ History Saved")
                print("History ID:", history.id)

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