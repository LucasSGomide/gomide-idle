import { useId, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { errorCode } from '@/lib/api/fetcher';
import { resolveErrorMessage } from '@/lib/i18n/error-message';
import { Input } from '@/ui/input';

import { SubmitButton } from './submit-button';

// design.md §5 Inputs / Buttons and §8 error states, shared by the sign-in and
// sign-up screens. The card is `surface` fill, `borderSubtle`, `radius.md`,
// `space-5` all round (§5 Cards). tab order: e-mail -> password -> submit ->
// link (§9).
//
// architecture-web.md rule 27 / §8: a field-level error puts `danger` on the
// border and renders helper text with a trailing icon; a form-level error
// (TOO_MANY_ATTEMPTS, REGISTRATION_CLOSED) has no owning field, so it sits under
// the submit control. Only one is ever shown at once. Every string is from the
// catalogue, keyed by the error `code` — never the server's message.

export type CredentialsFormProps = {
  title: string;
  submitLabel: string;
  onSubmit: (values: { email: string; password: string }) => void;
  pending: boolean;
  /** The failed request's error, if any — its `code` picks the message and the field. */
  error?: unknown;
  emailHelper?: string;
  passwordHelper?: string;
  /** Which field a given code is drawn against; anything else is form-level. */
  fieldForCode?: Record<string, 'email' | 'password'>;
  footer?: React.ReactNode;
};

export function CredentialsForm({
  title,
  submitLabel,
  onSubmit,
  pending,
  error,
  emailHelper,
  passwordHelper,
  fieldForCode = {},
  footer,
}: CredentialsFormProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const emailId = useId();
  const passwordId = useId();

  const code = error === undefined ? undefined : errorCode(error);
  const field = code ? fieldForCode[code] : undefined;
  const message = code ? resolveErrorMessage(t, code) : undefined;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit({ email, password });
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mx-auto w-full max-w-sm rounded-md border border-border-subtle bg-surface p-5"
    >
      <h1 className="font-display text-xl tracking-heading text-text-primary">
        {title}
      </h1>

      <div className="mt-5">
        <label
          htmlFor={emailId}
          className="block text-sm font-medium text-text-primary"
        >
          {t('auth.email')}
        </label>
        <Input
          id={emailId}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          variant={field === 'email' ? 'error' : 'default'}
          aria-invalid={field === 'email' || undefined}
          aria-describedby={
            emailHelper || field === 'email' ? `${emailId}-help` : undefined
          }
          className="mt-2"
        />
        <FieldHelp
          id={`${emailId}-help`}
          danger={field === 'email'}
          text={field === 'email' ? message : emailHelper}
        />
      </div>

      <div className="mt-4">
        <label
          htmlFor={passwordId}
          className="block text-sm font-medium text-text-primary"
        >
          {t('auth.password')}
        </label>
        <Input
          id={passwordId}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          variant={field === 'password' ? 'error' : 'default'}
          aria-invalid={field === 'password' || undefined}
          aria-describedby={
            passwordHelper || field === 'password'
              ? `${passwordId}-help`
              : undefined
          }
          className="mt-2"
        />
        <FieldHelp
          id={`${passwordId}-help`}
          danger={field === 'password'}
          text={field === 'password' ? message : passwordHelper}
        />
      </div>

      <div className="mt-5">
        <SubmitButton pending={pending}>{submitLabel}</SubmitButton>
        {code && !field ? (
          <p role="alert" className="mt-2 text-sm text-danger">
            {message}
          </p>
        ) : null}
      </div>

      {footer ? <div className="mt-4 text-sm">{footer}</div> : null}
    </form>
  );
}

function FieldHelp({
  id,
  danger,
  text,
}: {
  id: string;
  danger: boolean;
  text?: string;
}) {
  if (!text) return null;
  return (
    <p
      id={id}
      className={
        'mt-2 flex items-center gap-1 text-sm ' +
        (danger ? 'text-danger' : 'text-text-secondary')
      }
    >
      {text}
      {danger ? (
        <span aria-hidden="true" className="text-danger">
          {'⚠'}
        </span>
      ) : null}
    </p>
  );
}
