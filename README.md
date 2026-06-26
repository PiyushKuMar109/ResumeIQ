# ResumeIQ - AI Resume Analyzer

ResumeIQ is a full-stack resume analysis platform built with React, Vite, Django REST Framework, PostgreSQL, and Gemini. Users can upload resumes, generate ATS analysis, get role recommendations, view interview questions, and download PDF reports.

## Stack

- Frontend: React, Vite, Tailwind CSS
- Backend: Django, Django REST Framework, Simple JWT
- Database: PostgreSQL
- AI: Google Gemini API
- Storage: Local media in development, Amazon S3 recommended in production

## Project Structure

```text
ResumeIQ/
|-- frontend/
|-- backend/
|-- .gitignore
|-- LICENSE
|-- README.md
|-- render.yaml
|-- vercel.json
```

## Local Setup

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_job_roles
python manage.py runserver
```

Create `backend/.env` from `backend/.env.example`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Create `frontend/.env` from `frontend/.env.example`.

## Environment Variables

### Backend

```env
SECRET_KEY=replace-with-a-long-random-production-secret
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1
FRONTEND_URL=https://your-frontend-domain.vercel.app
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app
CSRF_TRUSTED_ORIGINS=https://your-frontend-domain.vercel.app
DATABASE_URL=postgres://...
GEMINI_API_KEY=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_STORAGE_BUCKET_NAME=
AWS_S3_REGION_NAME=ap-south-1
AWS_S3_CUSTOM_DOMAIN=
```

### Frontend

```env
VITE_API_URL=https://your-render-service.onrender.com/api
```

## Deploy Frontend on Vercel

Use the `frontend` directory as the project root.

- Framework preset: `Vite`
- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_URL=https://your-render-service.onrender.com/api`

`vercel.json` is included so client-side routes such as `/dashboard` and `/reports` resolve correctly after refresh.

## Deploy Backend on Render

This repo includes `render.yaml` for a Render Blueprint deploy.

### Render service settings

- Root directory: `backend`
- Runtime: `python`
- Build command: `pip install -r requirements.txt && python manage.py collectstatic --noinput`
- Pre-deploy command: `python manage.py migrate && python manage.py seed_job_roles`
- Start command: `gunicorn config.wsgi:application`

### Required Render environment variables

- `SECRET_KEY`
- `FRONTEND_URL`
- `CORS_ALLOWED_ORIGINS`
- `CSRF_TRUSTED_ORIGINS`
- `GEMINI_API_KEY`

### Notes

- `DATABASE_URL` is wired from the Render PostgreSQL instance in `render.yaml`.
- Render filesystem is ephemeral. If you want uploaded resumes and generated PDF reports to persist after restarts, configure S3 using the AWS variables above.
- Production Django settings now enable secure cookies, SSL forwarding, WhiteNoise static serving, and automatic Render hostname support.

## Before Deploying

- Make sure `.env`, `node_modules`, `dist`, `media`, `staticfiles`, and database files are not committed.
- Confirm the frontend points to the Render backend URL through `VITE_API_URL`.
- Confirm the backend trusts the deployed Vercel domain through `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`, and `CSRF_TRUSTED_ORIGINS`.
- If reports or uploads must persist, configure S3 before going live.

## Production Checklist

- Frontend builds with `npm run build`
- Backend dependencies include `gunicorn` and `whitenoise`
- Render database is attached
- Migrations run on deploy
- Job roles are seeded on deploy
- Vercel SPA routing is configured
- Secrets are kept in platform environment variables only
