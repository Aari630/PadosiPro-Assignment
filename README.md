# PadosiPro Take-Home Assignment

A full-stack mobile application featuring secure OTP authentication, profile management, and task selection.

## Architecture
- **Mobile:** React Native (Expo), Zustand (State Management), Axios, Expo Secure Store
- **Backend:** Node.js, Express, TypeScript, Zod (Validation), Jest (Testing)
- **Database:** SQLite via Prisma ORM (chosen for zero-dependency local execution)

## Setup Instructions

### 1. Backend Setup
\`\`\`bash
cd backend
npm install
cp .env.example .env
npx prisma db push
npm run dev
\`\`\`
*Note: The backend defaults to Ethereal Email. Check terminal output for OTP preview URLs.*

### 2. Mobile Setup
Open a new terminal:
\`\`\`bash
cd mobile
npm install
npx expo start -c
\`\`\`

### 3. Testing
\`\`\`bash
cd backend
npm test
\`\`\`