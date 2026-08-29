import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const docPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'openapi.json',
);

type OpenApiDoc = {
  paths: Record<string, Record<string, unknown>>;
  components: { schemas: Record<string, unknown> };
};

const doc = JSON.parse(readFileSync(docPath, 'utf8')) as OpenApiDoc;

// task 03/02 AC8 / stack-api.md rule 47, FR.11.4: one named component per auth
// request and response schema, with no inline duplicate left by
// cleanupOpenApiDoc.
describe('the auth routes in the OpenAPI document', () => {
  it('exposes the four endpoints', () => {
    expect(doc.paths['/auth/sign-up']).toHaveProperty('post');
    expect(doc.paths['/auth/sign-in']).toHaveProperty('post');
    expect(doc.paths['/auth/sign-out']).toHaveProperty('post');
    expect(doc.paths['/auth/session']).toHaveProperty('get');
  });

  it('carries one named component per auth request and response schema', () => {
    for (const name of [
      'SignUpRequest',
      'SignUpResponse',
      'SignInRequest',
      'SignInResponse',
      'SignOutResponse',
      'SessionResponse',
      'AuthUser',
    ]) {
      expect(doc.components.schemas).toHaveProperty(name);
    }
  });

  it('references AuthUser by $ref rather than inlining it in each response', () => {
    const serialised = JSON.stringify(doc.components.schemas);
    const refs = serialised.match(/#\/components\/schemas\/AuthUser/g) ?? [];
    // referenced by SignUpResponse, SignInResponse and SessionResponse
    expect(refs.length).toBeGreaterThanOrEqual(3);
    for (const name of [
      'SignUpResponse',
      'SignInResponse',
      'SessionResponse',
    ]) {
      expect(JSON.stringify(doc.components.schemas[name])).toContain(
        '#/components/schemas/AuthUser',
      );
    }
  });

  it('leaves no positionally-named auth component', () => {
    for (const name of Object.keys(doc.components.schemas)) {
      expect(name).not.toMatch(/(_\d+|Response_|Class\d|Schema\d)/);
    }
  });
});
