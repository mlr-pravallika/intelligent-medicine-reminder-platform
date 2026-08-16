from datetime import datetime, date, time
from apscheduler.schedulers.background import BackgroundScheduler

from .database import SessionLocal
from .models import Medicine, ReminderHistory, Notification
from .email_service import send_email
from .sms_service import send_sms


# ============================================================
# REMINDER TIME HELPERS
# ============================================================

def parse_reminder_times(value: str | None) -> list[str]:
    """
    Convert the database value:

        "09:00,21:00"

    into:

        ["09:00", "21:00"]
    """
    if not value:
        return []

    times: list[str] = []

    for item in value.split(","):
        cleaned = item.strip()

        if not cleaned:
            continue

        # Keep scheduler-compatible HH:MM values.
        if len(cleaned) >= 5:
            cleaned = cleaned[:5]

        times.append(cleaned)

    return times


# ============================================================
# MEDICINE DATE CHECK
# ============================================================

def medicine_active_today(medicine: Medicine) -> bool:
    today = date.today()

    if medicine.start_date:
        try:
            start_date = datetime.strptime(
                medicine.start_date,
                "%Y-%m-%d",
            ).date()

            if today < start_date:
                return False

        except ValueError:
            print(
                "Invalid start date:",
                medicine.start_date,
            )

    if medicine.end_date:
        try:
            end_date = datetime.strptime(
                medicine.end_date,
                "%Y-%m-%d",
            ).date()

            if today > end_date:
                return False

        except ValueError:
            print(
                "Invalid end date:",
                medicine.end_date,
            )

    return True


# ============================================================
# REMINDER DUPLICATE CHECK
# ============================================================

def has_sent_today(
    db,
    medicine: Medicine,
    reminder_time: str,
) -> bool:
    today_start = datetime.combine(
        date.today(),
        time.min,
    )

    existing = (
        db.query(ReminderHistory)
        .filter(
            ReminderHistory.user_id == medicine.user_id,
            ReminderHistory.medicine_name == medicine.medicine_name,
            ReminderHistory.reminder_time == reminder_time,
            ReminderHistory.sent_at >= today_start,
        )
        .first()
    )

    return existing is not None


# ============================================================
# LOW STOCK DUPLICATE CHECK
# ============================================================

def has_low_stock_notification_today(
    db,
    medicine: Medicine,
) -> bool:
    today_start = datetime.combine(
        date.today(),
        time.min,
    )

    existing = (
        db.query(Notification)
        .filter(
            Notification.user_id == medicine.user_id,
            Notification.notification_type == "LowStock",
            Notification.title == "Low Medicine Stock",
            Notification.created_at >= today_start,
            Notification.message.like(
                f"{medicine.medicine_name} has only%"
            ),
        )
        .first()
    )

    return existing is not None


# ============================================================
# LOW STOCK CHECK
# ============================================================

def create_low_stock_notification(
    db,
    medicine: Medicine,
) -> bool:
    """
    Create one in-app low-stock notification per medicine per day.

    The threshold is read from the medicine record itself.
    This means each medicine can have a different threshold.
    """

    remaining = medicine.remaining_quantity

    # Backward compatibility for old medicine records.
    threshold = (
        medicine.low_stock_threshold
        if getattr(
            medicine,
            "low_stock_threshold",
            None,
        ) is not None
        else 5
    )

    if remaining is None:
        return False

    if remaining > threshold:
        return False

    if has_low_stock_notification_today(
        db,
        medicine,
    ):
        return False

    notification = Notification(
        user_id=medicine.user_id,
        title="Low Medicine Stock",
        message=(
            f"{medicine.medicine_name} has only "
            f"{remaining} tablet(s) remaining. "
            f"Your low-stock alert is set to "
            f"{threshold} tablet(s). "
            "Please check your refill requirement."
        ),
        notification_type="LowStock",
        channel="App",
        is_read=False,
    )

    db.add(notification)

    return True


# ============================================================
# PROCESS ONE MEDICINE REMINDER
# ============================================================

def process_reminder(
    db,
    medicine: Medicine,
    current_time: str,
) -> None:
    if medicine.user is None:
        print(
            "No user found for:",
            medicine.medicine_name,
        )
        return

    if has_sent_today(
        db,
        medicine,
        current_time,
    ):
        print(
            "Already sent today:",
            medicine.medicine_name,
            current_time,
        )
        return

    print(
        "✅ REMINDER MATCHED:",
        medicine.medicine_name,
        current_time,
    )

    status = "Sent"

    # --------------------------------------------------------
    # STOCK
    #
    # One reminder event represents one scheduled dose.
    # Therefore one tablet is consumed for one reminder event.
    # --------------------------------------------------------

    remaining = medicine.remaining_quantity

    if remaining is None:
        remaining = medicine.total_quantity or 0

    medicine.remaining_quantity = max(
        0,
        int(remaining) - 1,
    )

    db.flush()

    print(
        f"{medicine.medicine_name} remaining:",
        medicine.remaining_quantity,
    )

    # --------------------------------------------------------
    # EMAIL
    # --------------------------------------------------------

    try:
        send_email(
            receiver_email=medicine.user.email,
            medicine_name=medicine.medicine_name,
            dosage=medicine.dosage,
            reminder_time=current_time,
        )

        print("✅ Email sent")

    except Exception as exc:
        print("❌ Email error:", exc)
        status = "Email Failed"

    # --------------------------------------------------------
    # SMS
    # --------------------------------------------------------

    try:
        if medicine.user.phone:
            send_sms(
                receiver_phone=medicine.user.phone,
                message=(
                    "MediCare AI Reminder\n"
                    f"Medicine: {medicine.medicine_name}\n"
                    f"Dosage: {medicine.dosage}\n"
                    f"Time: {current_time}"
                ),
            )

            print("✅ SMS sent")

    except Exception as exc:
        print("❌ SMS error:", exc)

        if status == "Sent":
            status = "SMS Failed"

    # --------------------------------------------------------
    # HISTORY
    # --------------------------------------------------------

    history = ReminderHistory(
        user_id=medicine.user.id,
        medicine_name=medicine.medicine_name,
        dosage=medicine.dosage,
        reminder_time=current_time,
        status=status,
    )

    db.add(history)

    # --------------------------------------------------------
    # IN-APP REMINDER NOTIFICATION
    # --------------------------------------------------------

    notification = Notification(
        user_id=medicine.user.id,
        title="Medicine Reminder",
        message=(
            f"It's time to take "
            f"{medicine.medicine_name} "
            f"({medicine.dosage})."
        ),
        notification_type="Reminder",
        channel="App",
        is_read=False,
    )

    db.add(notification)

    # --------------------------------------------------------
    # LOW STOCK AFTER DOSE
    # --------------------------------------------------------

    create_low_stock_notification(
        db,
        medicine,
    )


# ============================================================
# MAIN SCHEDULER CHECK
# ============================================================

def check_medicines():
    db = SessionLocal()

    try:
        now = datetime.now()
        current_time = now.strftime("%H:%M")

        print("=" * 60)
        print(
            "Reminder check:",
            now.strftime("%Y-%m-%d %H:%M:%S"),
        )
        print(
            "Current HH:MM:",
            current_time,
        )

        medicines = (
            db.query(Medicine)
            .filter(
                Medicine.is_active.is_(True),
            )
            .all()
        )

        print(
            "Active medicines:",
            len(medicines),
        )

        for medicine in medicines:
            if not medicine_active_today(
                medicine,
            ):
                continue

            # ------------------------------------------------
            # LOW STOCK
            #
            # This check runs every scheduler cycle, even if
            # there is no reminder at the current time.
            # ------------------------------------------------

            low_stock_created = (
                create_low_stock_notification(
                    db,
                    medicine,
                )
            )

            if low_stock_created:
                print(
                    "⚠ Low-stock alert created:",
                    medicine.medicine_name,
                )

            # ------------------------------------------------
            # REMINDERS
            # ------------------------------------------------

            reminder_times = parse_reminder_times(
                medicine.reminder_time,
            )

            print(
                f"{medicine.medicine_name}:",
                reminder_times,
            )

            if current_time not in reminder_times:
                continue

            process_reminder(
                db,
                medicine,
                current_time,
            )

        db.commit()

    except Exception as exc:
        db.rollback()

        print(
            "🔥 Scheduler error:",
            repr(exc),
        )

    finally:
        db.close()


# ============================================================
# APSCHEDULER
# ============================================================

scheduler = BackgroundScheduler()

scheduler.add_job(
    check_medicines,
    "interval",
    seconds=20,
    id="medicine-reminder-check",
    replace_existing=True,
    max_instances=1,
    coalesce=True,
)


def start_scheduler():
    if not scheduler.running:
        scheduler.start()
        print("✅ Scheduler Started")
