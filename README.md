# PadosiPro Take-Home Assignment

Mobile app and backend for the first user journey: sign up, verify email with an OTP, log in, complete a profile, pick tasks, see them on the home screen.

## Stack
- **Mobile:** React Native (Expo), TypeScript, Zustand, Axios, Expo Secure Store
- **Backend:** Node.js, Express, TypeScript, Prisma, PostgreSQL, Zod, JWT, bcrypt, Jest
- **Email:** SMTP via Nodemailer. Mailpit (optional local mail catcher) in development
- **Hosting:** Render (`render.yaml`)

## Prerequisites
- Node.js 20+ and npm
- PostgreSQL 14+ running locally (create an empty database, e.g. `padosipro`)
- Expo Go on a phone, or an Android emulator
- Optional: [Mailpit](https://github.com/axllent/mailpit/releases) (standalone binary or Docker) to catch OTP emails
- Optional: Docker Desktop, for the Compose alternative
- For APK builds: an Expo account and `eas-cli` (`npm i -g eas-cli`)

## Quick start (backend)

```bash
cp .env.example backend/.env        # Windows: Copy-Item .env.example backend/.env
# edit backend/.env: set DATABASE_URL to your local PostgreSQL database
cd backend
npm install
npm run setup                       # prisma generate + migrate deploy + seed
npm run dev
```

**Database options** (set `DATABASE_URL` in `backend/.env`):
- *Local PostgreSQL:* create the user and database that `.env.example` expects:
  ```bash
  psql -U postgres -c "CREATE USER padosipro WITH PASSWORD 'padosipro' CREATEDB;"
  psql -U postgres -c "CREATE DATABASE padosipro OWNER padosipro;"
  ```
- *No local PostgreSQL:* create a free [Neon](https://neon.tech) project and paste its direct (non-pooled) connection string. Setup, seed and all tests were verified this way.

The API runs at http://localhost:4000/api (health check: http://localhost:4000/health). The seed creates 20 tasks in 4 categories and can be re-run safely.

**Where to find the OTP locally**
- If Mailpit (or any SMTP server) is running on `SMTP_HOST:SMTP_PORT`, the email arrives in its inbox (Mailpit UI: http://localhost:8025).
- If no mail server is running, sending fails and the backend prints `OTP for <email>: 123456` in its terminal. Use that code on the verify screen.

### Alternative: Docker Compose (optional)
```bash
docker compose up --build
```
Starts PostgreSQL, Mailpit and the backend (migrate, seed, serve). Mailpit inbox: http://localhost:8025.

## Run the mobile app

```bash
cd mobile
npm install
npx expo start -c
```

Create `mobile/.env` and set the API address for your target:

```env
# Android emulator
EXPO_PUBLIC_API_URL=http://10.0.2.2:4000/api

# Physical phone on the same Wi-Fi (replace with your computer's LAN IP)
# EXPO_PUBLIC_API_URL=http://192.168.x.x:4000/api

# Deployed backend (see "Live backend" below)
# EXPO_PUBLIC_API_URL=https://padosipro-backend-8262.onrender.com/api
```

`EXPO_PUBLIC_*` values are embedded at build time. Restart Expo with `-c` after changing them and rebuild the APK.

**Trying the flow:** register, get the 6-digit code (Mailpit inbox or backend terminal), enter it on the verify screen, then log in and complete the profile and tasks.

## Environment variables

Backend (`backend/.env`, template in `.env.example`; Compose sets its own values):

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Signs JWTs. The server refuses to issue tokens if it is missing |
| `JWT_EXPIRES_IN` | Token lifetime, default `7d` |
| `SMTP_HOST`, `SMTP_PORT` | SMTP server (Mailpit: `localhost` / `1025`) |
| `SMTP_USER`, `SMTP_PASS` | SMTP credentials, empty for Mailpit |
| `EMAIL_FROM` | Sender address |

Mobile (`mobile/.env`): `EXPO_PUBLIC_API_URL`, the API base URL.

## Tests

PostgreSQL must be running and `backend/.env` must point to it (use a separate database if you want your dev data untouched).

```bash
cd backend
npm run setup
npm test
```

Covers OTP generation and hashing, expiry, the 5-attempt lock, single use, the resend cooldown, register rules (no password overwrite for unverified accounts), login rules (unverified users blocked), JWT expiry, and the full signup-to-task-selection flow. The tests clean up their own data.

## Build the APK

```bash
cd mobile
eas login
eas build -p android --profile preview
```

Set `EXPO_PUBLIC_API_URL` for the build in `eas.json` (the profile's `env` block). Uninstall any older APK before installing the new one.

## Live backend (Render free tier)
- API: https://padosipro-backend-8262.onrender.com/api
- Health: https://padosipro-backend-8262.onrender.com/health

Reviewer notes:
- **Cold start:** the service sleeps after 15 idle minutes, so the first request can take 30 to 60 seconds. The app timeout is 60 seconds and an uptime monitor pings `/health` every 5 minutes.
- **OTP delivery:** Render's free tier blocks outbound SMTP. On the deployed backend the OTP is written to the server logs. After tapping Sign Up, open Render > `padosipro-backend` > Logs and find `OTP for <email>: 123456`. Locally the OTP arrives in Mailpit.
- **Database:** the free Render PostgreSQL instance expires 30 days after creation.

## Deploy to Render
1. Push the repository to GitHub.
2. In Render choose **New > Blueprint** and select the repo. `render.yaml` creates the web service and database.
3. `DATABASE_URL` and `JWT_SECRET` are generated. The `SMTP_*` values are not required for the log fallback.
4. Migrations run on start (`prisma migrate deploy`) and the seed is idempotent.
5. Put the service URL in `EXPO_PUBLIC_API_URL` in `eas.json` and rebuild the APK.