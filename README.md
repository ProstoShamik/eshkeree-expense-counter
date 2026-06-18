# Eshkeree Expense Counter

Web app for personal expense tracking with users, categories, filters, sorting, and infinite loading.

## Stack

- Backend: FastAPI, async SQLAlchemy, JWT auth, bcrypt
- Frontend: React, Vite, TypeScript, React Query, Tailwind CSS
- Runtime: Docker Compose with Postgres, backend, and nginx frontend

## Configuration

Copy `backend/.env.example` to `backend/.env` if you run the backend directly, and replace secrets before running outside local development.

Important variables:

- `AUTH_SECRET_KEY`: use a long random value in production
- `CORS_ORIGINS`: comma-separated allowed origins
- `DB_URL`: SQLAlchemy database URL
- `DB_AUTO_CREATE_TABLES`: keep `true` for quick local development, use `false` with Alembic migrations

## Docker Quick Start

```bash
docker compose build
docker compose up -d
```

Open:

```text
http://localhost
```

Stop and remove the local Postgres volume:

```bash
docker compose down -v
```

## Database

For production-like environments, apply migrations from the backend directory:

```bash
cd backend
alembic upgrade head
```

For quick local development, `DB_AUTO_CREATE_TABLES=true` lets the app create tables on startup.

## Backend Checks

```bash
cd backend
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
python -c "import main; print(main.app.title)"
```

## Frontend Checks

```bash
cd frontend
npm ci
npm run lint
npx tsc --noEmit
npm run build
npm audit --audit-level=low
```

## Security Notes

- Do not commit real `.env` files.
- Replace `AUTH_SECRET_KEY` in production.
- Keep `CORS_ORIGINS` restricted to trusted domains.
- Runtime logs, virtual environments, local databases, and build artifacts are ignored by git.
