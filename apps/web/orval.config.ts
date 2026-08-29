import { defineConfig } from 'orval';

// stack-web.md rules 57-58, 61 / FR.11.3: Orval generates the fetch client, the
// TanStack Query hooks and the MSW handlers from apps/api's committed OpenAPI
// document. None of the three is hand-written.
//
// rule 61's three traps: pinned at 8.x (>= 8.0.2, past CVE-2026-23947);
// `httpClient: 'fetch'` because v8's mutator is a fetch option
// (`credentials: 'include'`); and `mock: { generators: [{ type: 'msw' }] }`
// rather than `mock: true`, so the handlers come without Faker data.
export default defineConfig({
  api: {
    input: {
      target: '../api/openapi.json',
    },
    output: {
      target: './src/lib/api/generated/tormented-path.ts',
      schemas: './src/lib/api/generated/model',
      client: 'react-query',
      httpClient: 'fetch',
      mode: 'single',
      mock: {
        generators: [{ type: 'msw' }],
      },
      override: {
        mutator: {
          path: './src/lib/api/fetcher.ts',
          name: 'fetcher',
        },
        // Orval's default hook kind by method: GET -> useQuery, POST -> use
        // useMutation. That is exactly what the footer's read and the auth
        // screens' writes each need, so `query` is left unset.
      },
    },
  },
});
