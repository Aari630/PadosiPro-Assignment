# PadosiPro Take-Home Assignment

A full-stack mobile application featuring secure OTP authentication, profile management, and task selection.

## Architecture
- **Mobile:** React Native (Expo), Zustand (State Management), Axios, Expo Secure Store
- **Backend:** Node.js, Express, TypeScript, Zod (Validation), Jest (Testing)
- **Database:** PostgreSQL via Prisma ORM
- **Email:** Mailpit for local SMTP testing
- **Hosting:** Render (Blueprint in `render.yaml`)

## Live Backend
- Base URL: https://padosipro-backend-8262.onrender.com/api
- Health check: https://padosipro-backend-8262.onrender.com/health

The APK is built with `EXPO_PUBLIC_API_URL` pointing to the live backend.

### Reviewer notes (Render free tier)
- **Cold start:** the free web service sleeps after 15 minutes without traffic. The first request can take 30-60 seconds, so the mobile API timeout is set to 60 seconds. An uptime monitor pings `/health` every 5 minutes to keep it awake.
- **OTP delivery:** Render's free tier blocks outbound SMTP, so verification emails cannot be sent from the deployed backend. The OTP is written to the server logs instead. After tapping **Sign Up**, open Render > `padosipro-backend` > **Logs** and look for:
  ```
  OTP for <email>: 123456
  ```
  Enter that code on the verify screen. Locally, the OTP arrives in Mailpit as normal.
- **Database:** the free Render PostgreSQL instance expires 30 days after creation.

## Setup Instructions (Local)

### 1. Configure the backend environment
From the project root, copy the root environment template into the backend folder.

Windows PowerShell:
```powershell
Copy-Item .env.example backend/.env
```

macOS/Linux:
```bash
cp .env.example backend/.env
```

### 2. Start Mailpit
From the project root:
```bash
docker compose up -d mailpit
```

Open the Mailpit inbox at http://localhost:8025.

### 3. Backend Setup
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

The backend runs at http://localhost:4000.

The local `DATABASE_URL` must point to a running PostgreSQL database.

### 4. Mobile Setup
Open a new terminal:
```bash
cd mobile
npm install
npx expo start -c
```

Set `mobile/.env` depending on the target:

```env
# Deployed backend (default for the APK)
EXPO_PUBLIC_API_URL=https://padosipro-backend-8262.onrender.com/api

# Local backend on a physical device (same Wi-Fi, no client isolation)
# EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_IP:4000/api
```

`EXPO_PUBLIC_*` values are embedded at build time, so rebuild the APK after changing them.

### 5. Testing
```bash
cd backend
npm test
```

## Deployment (Render)
1. Push the repository to GitHub.
2. In Render, choose **New > Blueprint** and select the repository. `render.yaml` creates the web service and the PostgreSQL database.
3. `DATABASE_URL` and `JWT_SECRET` are generated automatically. `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` and `EMAIL_FROM` are prompted for but are not required for the OTP log fallback to work.
4. Migrations run on start (`prisma migrate deploy`) and the seed script is idempotent.
5. Copy the service URL into `EXPO_PUBLIC_API_URL` in `eas.json` and rebuild the APK.