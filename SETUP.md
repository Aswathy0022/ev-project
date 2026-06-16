# VoltIQ — Developer Setup Guide

## Prerequisites

Install these before anything else:

| Software | Version | Install |
|----------|---------|---------|
| Python | 3.11+ | https://python.org/downloads |
| Node.js | 18+ | https://nodejs.org |
| pnpm | latest | `npm install -g pnpm` |
| Git | any | https://git-scm.com |

> **Note on Python 3.13+:** `passlib[bcrypt]` has a known compatibility issue with Python 3.13/3.14. Use Python 3.11 or 3.12 to avoid bcrypt errors.

---

## 1. Clone the Repo

```bash
git clone <repo-url>
cd ev-project
```

---

## 2. Backend Setup

```bash
# Create virtual environment
python3 -m venv .venv

# Activate it
# macOS/Linux:
source .venv/bin/activate
# Windows:
.venv\Scripts\activate

# Install backend dependencies
pip install -r backend/requirements.txt
```

---

## 3. Frontend Setup

```bash
cd frontend
pnpm install
cd ..
```

---

## 4. Run the App

### Option A — One command (recommended)

```bash
./start.sh
```

This starts both services:
- Backend: http://localhost:8000
- Frontend: http://localhost:3000

Press `Ctrl+C` to stop both.

### Option B — Manual

**Terminal 1 (backend):**
```bash
source .venv/bin/activate
cd backend
uvicorn main:app --port 8000 --reload
```

**Terminal 2 (frontend):**
```bash
cd frontend
pnpm dev
```

---

## 5. Admin Account

Default credentials seeded automatically on first run:

| Field | Value |
|-------|-------|
| Email | `admin@voltiq.dev` |
| Password | `admin123` |

To override, set environment variables before starting the backend:

```bash
export ADMIN_EMAIL=your@email.com
export ADMIN_PASSWORD=yourpassword
```

---

## 6. API Docs

FastAPI auto-generates docs at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
