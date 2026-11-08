# EasyAmt frontend

React + TypeScript SPA built with Vite against the current `laqg` backend branch. It supports Supabase authentication, PDF upload, status polling, preliminary candidate results, a browser PDF view, document listing and deletion. Candidate obligations, quotes and dates are **not verified** by this backend phase. Task updates, date anchors and account deletion remain unavailable in the backend.

The interface language selector offers English, Spanish and German and remembers the selection in the browser. The upload form offers the same three languages for the generated summary, independently of the interface language.
English is the default when no interface preference has been saved. PDF selection supports clicking and drag-and-drop. Uploading an analysis requires the FastAPI backend at `VITE_API_BASE_URL`; starting only Vite does not start the API.

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

The FastAPI backend publishes OpenAPI at `/openapi.json`. With the backend running locally, generate its current types using:

```sh
npm run generate:api
```

The generated file belongs at `src/shared/api/generated.ts`. The current handwritten response types in `src/features/documents/api.ts` mirror this branch's Pydantic schemas; replace them with generated types when the contract is frozen. The frontend calls `/v1/documents/upload`, `/v1/documents/{id}/status`, `/v1/documents/{id}/analysis`, the list endpoint and DELETE. It keeps PDFs in memory only and verifies SHA-256 before reattaching after a reload.

## Structure

- `src/features/auth`: Supabase client and sign-in UI.
- `src/features/upload`: PDF selection and validation.
- `src/features/documents`: upload, status polling, candidate results, PDF reattachment, list and delete.
- `src/shared/api`: API helper and OpenAPI generation target.
- `src/shared/i18n.ts`: Spanish and English copy.
- `src/App.tsx`: starter navigation and feature screens.

Vercel uses `vercel.json` to serve the SPA on deep links. The upload maximum is checked in the browser; the backend must enforce both 5 MB and 8 pages.
