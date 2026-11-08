Generate `generated.ts` from the backend's OpenAPI document while the backend runs locally:

```sh
npm run generate:api
```

The current backend branch exposes upload, status, candidate analysis, list and delete routes. Its task and account routes are still pending. The temporary types in `src/features/documents/api.ts` mirror the current Pydantic responses and should be replaced when the contract is frozen.
