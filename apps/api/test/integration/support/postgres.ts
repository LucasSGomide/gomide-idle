// The one Postgres engine tag: docker-compose.yml pulls this and so does the
// Jest integration container, so an integration test proves nothing a different
// version would not (FR.15.1). apps/api/test/integration/harness.spec.ts asserts
// the compose file matches.
export const POSTGRES_IMAGE = 'postgres:17.11-alpine';
