# Database Schema

## users

| Field         | Type     | Purpose                   |
|---            |---       |---                        |
| id            | Integer  | Unique user ID            |
| name          | String   | User full name            |
| email         | String   | Login email               |
| password_hash | String   | Encrypted password        |
| role          | String   | patient, caregiver, admin |
| phone         | String   | Contact number            |
| created_at    | DateTime | Account creation date     |

## medicines

| Field          | Type    | Purpose              |
|---             |---      |---                   |
| id             | Integer | Unique medicine ID   |
| user_id        | Integer | Owner of the medicine|
| medicine_name  | String  | Medicine name        |
| dosage         | String  | Example: 500 mg      |
| frequency      | String  | Example: Twice daily |
| stock_quantity | Integer | Available tablets    |

## medication_logs

| Field           | Type     | Purpose          |
|------           |---       |---               |
| id              | Integer  | Unique log ID    |
| medicine_id     | Integer  | Related medicine |
| scheduled_time  | DateTime | Reminder time    |
| status          | String   | Taken or Missed  |
| taken_at        | DateTime | Actual taken time|