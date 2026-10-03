# Design Decisions & Trade-offs

1. **SQLite Pivot:** Transitioned from Docker/PostgreSQL to SQLite to guarantee a friction-free reviewer experience. The app runs immediately upon `npm run dev` with zero container overhead.
2. **Atomic Registration:** Implemented Prisma `$transaction` blocks and rollback logic during registration. If an OTP email fails to send, the database immediately purges the orphaned user to prevent locked-out states.
3. **JWT Security:** Strict typing and hardcoded fallback removal ensure the app fails securely if environment variables are missing.
4. **Offline Task Filtering:** Mobile task catalog search is handled locally to prevent unnecessary backend bandwidth usage.