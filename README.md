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

## Pixel mascot and document chat (CatPackFree)

The local CatPackFree asset catalogue has three unchanged strips, all with **32 × 32 frames** on row **0**:

- `Idle.png` → `public/mascot/catpack-idle.png`: 320 × 32, ten frames (idle/waiting).
- `Box3.png` → `public/mascot/catpack-box.png`: 128 × 32, four frames (retained in the dev catalogue; unused by the assistant).
- `drculacat.png` → `public/mascot/catpack-answer.png`: 192 × 32, six frames (response pose in the assistant).

Dimensions come from PNG IHDR and frame boundaries were visually inspected. These are the pack's idle, box and costume poses; there is no literal book-reading or talking artwork. No selected rows are unidentified. `AnimationClip.src/columns/rows` can override the base sheet per state. Run `node scripts/inspect-mascot.mjs` to verify all three assets.

Run `npm run dev` and open **http://localhost:5173/dev/mascot** for every state and a selectable animated preview without authentication. DEV-guarded lazy imports keep this gallery and browser checks out of production. The gallery never sends chat requests.

The assistant continuously loops the idle sprite, including while reading, waiting, or showing an error. Pipeline changes update bubble text without restarting the sprite. Only a displayed chat answer changes to the response sprite. Constant playback is explicitly enabled even when the system requests reduced motion, as requested for this assistant. There are no pause, close or restore controls, and no visual preference is persisted. Old dismissal preferences are ignored. The reusable PixelMascot component still supports system motion preferences when used elsewhere.

On a **completed document**, click the **?** symbol. It has a translated accessible label and opens/folds questions while keeping the assistant visible. The form calls the existing authenticated `POST /v1/documents/{id}/chat` endpoint only on submission. No backend files or dependencies were changed. The question composer sits above the cat status bubble, with separate user/assistant speech bubbles above it. New turns push older bubbles upward inside a bounded scrolling history, keeping the desktop cat anchored at the bottom. The UI shows answers, citation quotes/pages, clarification responses, suggested followups, and localized request/quota errors. Questions remain editable for retry after errors. Pending questions retain the idle pose; received answers use the costume pose, including clarification replies.

Chat history stays in React memory, is bounded to the backend defaults (10 turns, 2000 Unicode characters per turn), and clears when leaving/switching documents. Requests abort on unmount; late replies cannot enter another document. The textarea limits questions to 1000 characters. Only the question and bounded history are sent: no browser document-text extraction, caching or storage is added. The chat supports Spanish and English; the German UI explicitly indicates its English response fallback. Existing server deployment, authentication, inference configuration and the backend's documented chat-usage migration must be available for live responses.

Status polling and deadline-anchor detection still reuse existing document data. The fixed desktop panel has a reserved rail. At widths up to 1100px or heights up to 500px it moves below the document content so it cannot cover form/PDF controls.

Checks:

```sh
npm run typecheck
npm test
node scripts/inspect-mascot.mjs
node scripts/check-mascot-browser.mjs
npm run build
```

The browser script uses installed Chrome/Edge (or `CHROME_PATH`), a temporary profile, Vite port 5179 and debugger port 9239. It covers real React DOM animation, system motion behavior in the reusable sprite, continuous assistant playback, unchanged playback across pipeline transitions, accessible question-mark controls, callbacks, translations, chat submission/history/citations/error handling, abort/isolation, responsive overlap, native timer advancement and distinct decoded sprite frames. Chat HTTP responses are intercepted in these tests: no paid model inference is performed. Vitest covers status/frame logic, accessibility/geometry and the chat HTTP contract/history limits. This repository has no lint script or Testing Library/DOM test packages; no dependencies were added. Existing plain CSS, state navigation and shared i18n resources are retained.

Mascot credit — Author: **[AUTHOR — to be supplied]**; source URL: **[SOURCE URL — to be supplied]**; license: **[LICENSE NAME — to be supplied]**; attribution: **[ATTRIBUTION TEXT — to be supplied]**. See `public/mascot/LICENSE.txt`. Local assets have no supplied license metadata; placeholders do not establish usage rights.
