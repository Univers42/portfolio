# Proof of Work & Agentic Portfolio

A React, Vite, TypeScript, and Tailwind application for a project portfolio and a small multi-persona workspace.

## OpenRouter chat setup

The Team Workspace calls OpenRouter through the Vercel serverless function at `/api/chat`. The API key stays on the server and is never sent to the browser. Chat currently uses OpenRouter's free-model router (`openrouter/free`); free model availability and rate limits can vary.

### Vercel

1. In Vercel, open the `portfolio` project and go to **Settings → Environment Variables**.
2. Add `OPENROUTER_API_KEY` as a **Secret**. Do not use the `VITE_` prefix: Vite exposes `VITE_` variables to browser bundles.
3. Enable it for **Production** and **Preview** (and Development if you use Vercel's local development server), then save.
4. Remove the old `VITE_OPENROUTER_API_KEY` entry. A new deployment is required for environment changes to take effect.
5. Send a message from **Team workspace** and check that the assistant response is labeled as an OpenRouter response.

Because the site is public, the chat endpoint can be called by visitors and uses the project's OpenRouter account. The function limits message size and output tokens and only routes to `openrouter/free`; set a usage limit in OpenRouter and monitor usage before sharing the endpoint widely.

### Local development

1. Copy `.env.example` to `.env.local` and add your own `OPENROUTER_API_KEY` value.
2. Run the app through the Vercel development server (`npx vercel dev`) so the `/api/chat` function is available. Vite's standalone dev server does not run Vercel functions.
3. Never commit `.env.local` or paste the API key into frontend code.

## Build

```sh
npm ci
npm run build
```
