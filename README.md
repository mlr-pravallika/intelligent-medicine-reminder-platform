# Intelligent Medicine Reminder Platform

A full-stack healthcare workflow application designed to help users manage medicine reminders, user profiles, and secure account access.

## Project Overview

The Intelligent Medicine Reminder Platform provides a foundation for patients to securely register, log in, manage their profile, and access protected dashboard features. The project is being developed milestone by milestone with a structured frontend, backend, database design, and API documentation workflow.

## Milestone 1: Requirements, Database Design and Core Setup

Completed features:

- Defined healthcare workflow and project scope
- Designed database schema and system workflow documentation
- Set up frontend and backend project environments
- Implemented user registration
- Implemented secure password hashing
- Implemented user login with JWT authentication
- Created protected dashboard API access
- Added role field for role-based access foundation
- Added user profile update API
- Configured API testing through Swagger UI

## Technology Stack

- **Backend:** FastAPI (Python)

- **API Documentation & Testing:** Swagger UI / OpenAPI

- **Authentication:** JWT Bearer Token Authentication

- **Database:** PostgreSQL with SQLAlchemy

- **Frontend:** HTML, CSS, JavaScript

- **Version Control:** Git and GitHub

## Local Development Links

These links work only when the project servers are running locally.

| Service                   | URL                       | Purpose                                       |
|---                        |---                        |---                                            |
| Frontend Application      | http://localhost:5173/    | Opens the frontend user interface             |
| Backend API Documentation | http://127.0.0.1:8000/docs| Opens Swagger UI for testing API endpoints    |
| Backend API Home          | http://127.0.0.1:8000/    | Checks whether the FastAPI backend is running |

## API Endpoints

| Method     | Endpoint             | Description                                              |
|---         |---                   |---                                                       |
| `POST`     | `/register`          | Registers a new user                                     |
| `POST`     | `/login`             | Authenticates a user and returns a JWT access token      |
| `GET`      | `/dashboard`         | Protected dashboard endpoint requiring JWT authentication |
| `PUT`      | `/profile/{user_id}` | Updates a user's profile details                          |

## Project Structure

```text
medicine-reminder-platform/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── database.py
│   │   └── auth.py
│   ├── requirements.txt
│   └── venv/
│
├── frontend/
│   └── dashboard.html
│
├── docs/
│   ├── database-schema.md
│   ├── wireframes.md
│   └── workflow.md
│
├── .gitignore
└── README.md