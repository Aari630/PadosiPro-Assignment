# PadosiPro Take-Home Assignment

A full-stack mobile application featuring secure OTP authentication, profile management, and task selection.

## Architecture
- **Mobile:** React Native (Expo), Zustand (State Management), Axios, Expo Secure Store
- **Backend:** Node.js, Express, TypeScript, Zod (Validation), Jest (Testing)
- **Database:** SQLite via Prisma ORM (chosen for zero-dependency local execution)
- **Email:** Mailpit for local SMTP testing

## Setup Instructions

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

### 4. Mobile Setup
Open a new terminal:
```bash
cd mobile
npm install
npx expo start -c
```

For a physical device, set `mobile/.env` to use the computer's local IP:
```env
EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_IP:4000/api
```

### 5. Testing
```bash
cd backend
npm test
```