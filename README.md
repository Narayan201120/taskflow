# TaskFlow - Team Task Manager

A full-stack web application for creating projects, assigning tasks, and tracking progress with role-based access control (Admin/Member).

![Tech Stack](https://img.shields.io/badge/React-TypeScript-blue?logo=react) ![Backend](https://img.shields.io/badge/FastAPI-Python-green?logo=fastapi) ![DB](https://img.shields.io/badge/PostgreSQL-Database-blue?logo=postgresql) ![Deploy](https://img.shields.io/badge/Railway-Deployed-purple?logo=railway)

## Live Demo

> **Live URL:** [https://your-app.up.railway.app](https://your-app.up.railway.app)

## Features

- **Authentication** -- Signup/Login with JWT tokens (access + refresh)
- **Projects** -- Create, edit, and delete projects
- **Team Management** -- Invite members by email, assign Admin or Member roles
- **Task Management** -- Create, assign, and track tasks with Kanban-style columns (To Do, In Progress, Done)
- **Dashboard** -- Aggregated stats: total projects, tasks by status, overdue count, personal task feed
- **Role-Based Access Control** -- Admins can manage members and delete projects; Members can create/update tasks
- **Responsive Design** -- Dark-themed glassmorphism UI that works on all devices

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| Backend | FastAPI, Python 3.12 |
| Database | PostgreSQL |
| ORM | SQLAlchemy 2.0 (async) |
| Auth | JWT (python-jose + bcrypt) |
| Deployment | Railway |

## Database Schema

```
Users ──┐
        ├──< ProjectMembers >──┤
Projects ┘                      │
        └──< Tasks >────────────┘
```

- **Users** -- id, email, username, full_name, hashed_password
- **Projects** -- id, name, description, created_by
- **ProjectMembers** -- project_id, user_id, role (admin/member)
- **Tasks** -- id, title, description, status, priority, project_id, assigned_to, due_date

## Running Locally

### Prerequisites
- Python 3.12+
- Node.js 20+
- PostgreSQL

### Backend

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate        # Windows
# source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
pip install email-validator

# Create the database
psql -U postgres -c "CREATE DATABASE taskmanager;"

# Create .env file
cp .env.example .env
# Edit .env with your database credentials

# Run
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

### API Docs

FastAPI auto-generated docs at http://localhost:8000/docs

## API Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/signup` | Register user | Public |
| POST | `/api/auth/login` | Login (JWT) | Public |
| GET | `/api/auth/me` | Current user | Auth |
| GET | `/api/projects/` | List projects | Auth |
| POST | `/api/projects/` | Create project | Auth |
| GET | `/api/projects/:id` | Project details | Member |
| PUT | `/api/projects/:id` | Update project | Admin |
| DELETE | `/api/projects/:id` | Delete project | Admin |
| POST | `/api/projects/:id/members` | Add member | Admin |
| DELETE | `/api/projects/:id/members/:uid` | Remove member | Admin |
| GET | `/api/projects/:id/tasks/` | List tasks | Member |
| POST | `/api/projects/:id/tasks/` | Create task | Member |
| PUT | `/api/projects/:id/tasks/:tid` | Update task | Member |
| DELETE | `/api/projects/:id/tasks/:tid` | Delete task | Admin/Creator |
| GET | `/api/dashboard/` | Dashboard stats | Auth |
| GET | `/api/dashboard/my-tasks` | My tasks | Auth |

## Deployment (Railway)

1. Push code to GitHub
2. Create a new Railway project
3. Add **PostgreSQL** service
4. Add **Backend** service (set root directory to `backend/`)
   - Railway auto-detects the Dockerfile
   - Set env vars: `DATABASE_URL` (auto-linked from PG), `SECRET_KEY`, `CORS_ORIGINS`
5. Add **Frontend** service (set root directory to `frontend/`)
   - Set build arg: `VITE_API_URL` = backend service URL
6. Both services deploy automatically on push

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI entry point
│   │   ├── config.py          # Environment config
│   │   ├── database.py        # SQLAlchemy async setup
│   │   ├── models.py          # ORM models
│   │   ├── schemas.py         # Pydantic schemas
│   │   ├── routers/           # API route handlers
│   │   ├── services/          # Business logic (RBAC)
│   │   └── utils/             # JWT & password hashing
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/        # Layout, ProtectedRoute
│   │   ├── context/           # Auth context
│   │   ├── pages/             # Dashboard, Projects, Login
│   │   ├── services/          # API client layer
│   │   └── types/             # TypeScript interfaces
│   ├── Dockerfile
│   └── nginx.conf
└── README.md
```

## Author

Narayan Joshi
