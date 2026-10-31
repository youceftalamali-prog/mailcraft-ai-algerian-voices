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
- Authentication currently stores users and sessions in `.data/server-auth.json`. This is suitable only for a single persistent Node.js host with writable disk. It is **not production-safe on Cloudflare Workers or other ephemeral/serverless runtimes**. Use Cloudflare D1 (or another durable database) for users, password hashes, and sessions before deploying this authentication implementation there.
- Do not commit `.data/`, `.env`, or runtime secrets.

## Validation

```bash
npm run lint
npm test
npm run build
```
