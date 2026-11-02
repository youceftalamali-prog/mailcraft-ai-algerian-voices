<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/e5f52b2d-9b03-4cdd-a6d9-2cf49854ff76

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


## Security and deployment notes

- Set `GEMINI_API_KEY` as a server-side secret. Never put it in frontend code or commit a real `.env` file.
- Set `ADMIN_PASSWORD` as a unique secret of at least 16 characters (32+ random characters recommended). There is no built-in or quick-login password.
- Google sign-in is intentionally disabled until a Google Identity Services client ID and server-side ID-token verification are configured.
- User accounts and sessions are stored in Neon PostgreSQL. Only a SHA-256 digest of each session cookie token is stored in the database; passwords use salted scrypt hashes. Apply `migrations/001_auth_tables.sql` when preparing a new Neon database (the server also creates the required tables at startup).
- Do not commit `.data/`, `.env`, or runtime secrets.

## Deploy to Google Cloud Run

1. Create a Neon PostgreSQL database and copy its pooled connection string.
2. Configure `DATABASE_URL`, `GEMINI_API_KEY`, and `ADMIN_PASSWORD` as Cloud Run secrets (never commit their values).
3. Build and deploy the container from this repository with Cloud Build or the Cloud Run source deployment flow. The included Dockerfile listens on the Cloud Run-provided `PORT` (default 8080).
4. Configure the Cloud Run startup/readiness probe to use `/api/health`. It returns HTTP 503 if PostgreSQL is unavailable.

The current in-memory rate limiter is per container instance. For strict global rate limits across multiple Cloud Run instances, add a shared limiter such as Redis before scaling traffic.

## Validation

```bash
npm run lint
npm test
npm run build
```
