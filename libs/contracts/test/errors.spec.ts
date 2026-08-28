import {
  assertSituationCode,
  ErrorCodeConventionError,
  isSituationCode,
} from '../src/errors.js';

// architecture-api.md rule 39 / naming.md rule 15.
describe('assertSituationCode', () => {
  it('accepts a code that names the situation', () => {
    expect(() => assertSituationCode('EMAIL_TAKEN')).not.toThrow();
    expect(() => assertSituationCode('VALIDATION_FAILED')).not.toThrow();
    expect(isSituationCode('CHARACTER_ALREADY_ONLINE')).toBe(true);
  });

  it('rejects a code that names an HTTP status word', () => {
    expect(() => assertSituationCode('CONFLICT')).toThrow(
      ErrorCodeConventionError,
    );
    expect(() => assertSituationCode('NOT_FOUND')).toThrow(
      ErrorCodeConventionError,
    );
    expect(isSituationCode('BAD_REQUEST')).toBe(false);
  });

  it('rejects a code that names an HTTP status number', () => {
    expect(() => assertSituationCode('error409')).toThrow(
      ErrorCodeConventionError,
    );
    expect(() => assertSituationCode('HTTP_500')).toThrow(
      ErrorCodeConventionError,
    );
  });

  it('rejects a code that is not SCREAMING_SNAKE_CASE', () => {
    expect(() => assertSituationCode('emailTaken')).toThrow(
      ErrorCodeConventionError,
    );
    expect(() => assertSituationCode('Email_Taken')).toThrow(
      ErrorCodeConventionError,
    );
  });
});
