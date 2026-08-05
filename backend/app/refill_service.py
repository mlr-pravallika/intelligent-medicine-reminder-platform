from datetime import datetime, timedelta


def predict_refill(medicine):

    if medicine.tablets_per_day <= 0:
        return None

    days_left = medicine.remaining_quantity / medicine.tablets_per_day

    refill_date = datetime.now() + timedelta(days=days_left)

    return {

        "medicine_name": medicine.medicine_name,

        "remaining_quantity": medicine.remaining_quantity,

        "total_quantity": medicine.total_quantity,

        "days_left": round(days_left),

        "refill_date": refill_date.strftime("%Y-%m-%d"),

        "needs_refill": medicine.remaining_quantity <= 5

    }
