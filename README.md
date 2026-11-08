# EasyAmt frontend

React + TypeScript SPA scaffolded with Vite from the EasyAmt SAD, including its version 1.1 Vertex AI amendment (7 November 2026). The current backend implements only health endpoints, so this frontend provides navigation, Supabase email/password authentication, bilingual UI, local PDF validation and feature boundaries. It does not submit or display analyses yet.

## Local setup

Requires Node.js 22.12+.

```sh
npm ci
cp .env.example .env
npm run dev
```

On Windows PowerShell, copy the environment file with `Copy-Item .env.example .env` and use `npm.cmd` if `npm.ps1` is blocked by execution policy.

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for authentication. `VITE_API_BASE_URL` points at FastAPI. Only public values belong in `VITE_*`. The browser never calls Vertex AI directly and must not contain Google Cloud credentials or a Supabase service role key. The backend is responsible for Vertex AI access through ADC/WIF. Without Supabase values the app runs in a frontend preview mode.

## Checks

```sh
npm run build
npm test
```

## API integration

The FastAPI backend will publish OpenAPI at `/openapi.json`. Once the document and task routes are implemented, run:

```sh
npm run generate:api
```

The generated file belongs at `src/shared/api/generated.ts`. Wire feature API hooks to its types and the authenticated `apiRequest` helper. Poll the future document status endpoint at 1–3 second intervals until completion or failure. Keep the selected PDF in memory and reattach it after a reload if a viewer needs it; do not persist the file.

## Structure

- `src/features/auth`: Supabase client and sign-in UI.
- `src/features/upload`: PDF selection and validation.
- `src/shared/api`: API helper and OpenAPI generation target.
- `src/shared/i18n.ts`: Spanish and English copy.
- `src/App.tsx`: starter navigation and feature screens.

Vercel uses `vercel.json` to serve the SPA on deep links. The upload maximum is checked in the browser; the backend must enforce both 5 MB and 8 pages.
