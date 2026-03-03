# Taallm Platform (تعلم)

Professional IT Learning Platform with AI Assistant integration.

## Deployment to Render.com

This project is configured for deployment using Render Blueprints.

### Prerequisites
1. A PostgreSQL database (e.g., from Neon.tech).
2. A Bunny.net account for video hosting.
3. An OpenAI API key for AI features.

### Deployment Steps
1. Push this code to a GitHub or GitLab repository.
2. Go to **Render Dashboard** -> **Blueprints**.
3. Connect your repository.
4. Render will automatically detect `render.yaml` and prompt for environment variables.

### Environment Variables Required
- `DATABASE_URL`
- `OPENAI_API_KEY`
- `SESSION_SECRET`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `BUNNY_LIBRARY_ID`
- `BUNNY_API_KEY`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`

## Development
```bash
npm install
npm run dev
```
