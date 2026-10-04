# Design

## Architecture
Expo (React Native) app, Express + TypeScript API, PostgreSQL through Prisma. The app talks to `/api` over HTTPS with a JWT in the `Authorization` header, stored on the device in Secure Store. Zustand holds auth state; navigation switches between the auth stack and the app stack from that state. The backend is split into routes, Zod validation middleware, controllers, and small utilities (crypto, mailer). Data model: `User`, `EmailOtp`, `Profile`, `Category`, `Task`, `UserTask` (composite key).

## Main decisions and trade-offs
1. **PostgreSQL via Prisma.** Started on SQLite for a quick local run, moved to PostgreSQL so the app could be deployed with a managed database. Migrations run with `prisma migrate deploy` on start. The seed is idempotent.
2. **OTP security.** Codes are stored as SHA-256 hashes, expire after 10 minutes, are single use (marked used inside a transaction), and allow 5 wrong attempts. Resend has a 30-second cooldown and invalidates earlier codes. SHA-256 keeps it simple; a 6-digit code is brute-forceable offline if the database leaks, so an HMAC with a server secret is the next step.
3. **Re-registering an unverified email does not change the password.** This stops someone taking over an email address they do not own. Trade-off: a user who re-registers with a different password before verifying still has the original one. The resend cooldown applies to re-registration too.
4. **Business Name is optional.** Many households have no business, so requiring it would block onboarding. It is validated only when present.
5. **Non-blocking OTP email.** Render's free tier blocks outbound SMTP, so awaiting the email made registration time out. The OTP is saved first and the email is sent without blocking. If sending fails, the OTP is logged so the demo flow still works. Locally, mail goes to Mailpit. This fallback is demo-only.
6. **JWT.** No fallback secret: the server refuses to issue tokens if `JWT_SECRET` is missing. 7-day expiry, no refresh tokens.
7. **Deployment for review.** Render's cold starts are handled with a 60-second app timeout and a `/health` ping. `EXPO_PUBLIC_*` values are compiled in, so changing the API URL needs a rebuild.
8. **Client-side task search.** The catalogue is small, so filtering locally avoids extra requests.
9. **Local run without Docker.** Docker Desktop would not install on my machine, so the primary path is native PostgreSQL plus `npm run setup` (generate, migrate, seed) and `npm run dev`. A Docker Compose file (PostgreSQL, Mailpit, backend) is included as an optional alternative. Without a mail server, the OTP is printed in the backend terminal.

## Left out
- Real email provider in production (the deployed backend logs the OTP)
- Rate limiting on login and register
- Refresh tokens and session revocation
- Mobile UI tests
- Inline validation, empty states and loading states on some form screens, which rely on alerts

## Next, with another week
- Send mail through an HTTPS provider (Resend or Brevo) and remove the OTP log line
- HMAC for the OTP hash; make the attempt counter one atomic conditional update; cap resends per hour
- Rate-limit auth routes; add refresh tokens and revocation
- Return 400 for unknown task IDs instead of a generic server error
- Managed PostgreSQL with backups
- Inline form validation, empty and loading states, and mobile UI tests