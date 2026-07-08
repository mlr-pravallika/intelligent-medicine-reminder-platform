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

## Tech Stack

### Frontend
- HTML
- CSS
- JavaScript
- Vite

### Backend
- Python
- FastAPI
- SQLAlchemy
- Pydantic
- JWT Authentication
- Uvicorn

### Database
- PostgreSQL
- SQLAlchemy ORM

## Local Development Links

These links work only when the project servers are running locally.

| Service | URL | Purpose |
|---|---|---|
| Frontend Application | http://localhost:5173/ | Opens the frontend user interface |
| Backend API Documentation | http://127.0.0.1:8000/docs | Opens Swagger UI for testing API endpoints |
| Backend API Home | http://127.0.0.1:8000/ | Checks whether the FastAPI backend is running |

## API Endpoints

| Method | Endpoint             | Description                                               |
|---     |---                   |---                                                        |
| `POST` | `/register`          | Registers a new user                                      |
| `POST` | `/login`             | Authenticates a user and returns a JWT access token       |
| `GET`  | `/dashboard`         | Protected dashboard endpoint requiring JWT authentication |
| `PUT`  | `/profile/{user_id}` | Updates a user's profile details                          |

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

## How to Run Locally

### Backend

Open a terminal in the project root folder and run:

```bash
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload

## Open Swagger API documentation in your browser:

http://127.0.0.1:8000/docs

## Frontend

Open a new terminal in the project root folder and run:

```bash
cd frontend
npm install
npm run dev

Open the frontend application in your browser:

http://localhost:5173/

### Authentication Flow


Register a new user using POST /register.

Log in using POST /login.

Copy the returned JWT access_token.

Click Authorize in Swagger UI.

Paste the token and click Authorize.

Test protected endpoints such as GET /dashboard.

Future Enhancements

Medicine management module

Medicine schedules and dosage tracking

Automated reminder notifications

Caregiver and doctor role workflows

Reminder history and adherence tracking

Responsive frontend dashboard

Deployment to a cloud platform


### Author

Lalitha Raga Pravallika
B.Tech, Electronics and Communication Engineering