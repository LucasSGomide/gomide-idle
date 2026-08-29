import {
  Link,
  createFileRoute,
  redirect,
  useNavigate,
} from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { resolveSession } from '@/features/session/require-session';
import { useRefreshSession } from '@/features/session/use-refresh-session';
import { useSession } from '@/features/session/use-session';
import { useAuthControllerPostSignUp } from '@/lib/api/generated/tormented-path';
import { Button } from '@/ui/button';

import { CredentialsForm } from './-auth/credentials-form';

// wireframe 08: `/sign-up`, its own route linked from sign-in. Same redirect to
// /characters when a session already exists. With registration closed the route
// still resolves and renders the closed notice in place of the form (design.md
// §8's empty state applied to a form).
export const Route = createFileRoute('/sign-up')({
  beforeLoad: async ({ context }) => {
    const session = await resolveSession(context.queryClient);
    if (session.user) throw redirect({ to: '/characters' });
  },
  component: SignUp,
});

function SignUp() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const session = useSession();
  const refreshSession = useRefreshSession();
  const mutation = useAuthControllerPostSignUp();

  if (session.data && !session.data.registrationOpen) {
    return (
      <div className="mx-auto w-full max-w-sm rounded-md border border-border-subtle bg-surface p-5">
        <h1 className="font-display text-xl tracking-heading text-text-primary">
          {t('signUp.closedTitle')}
        </h1>
        <p className="mt-5 text-sm text-text-secondary">
          {t('signUp.closedBody')}
        </p>
        <div className="mt-5">
          <Link to="/">
            <Button className="w-full">{t('signUp.closedCta')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <CredentialsForm
      title={t('signUp.title')}
      submitLabel={t('signUp.submit')}
      pending={mutation.isPending}
      error={mutation.error ?? undefined}
      emailHelper={t('signUp.emailHelper')}
      passwordHelper={t('signUp.passwordHelper')}
      fieldForCode={{ EMAIL_TAKEN: 'email' }}
      onSubmit={({ email, password }) =>
        mutation.mutate(
          { data: { email, password } },
          {
            onSuccess: async () => {
              // Awaited for the same reason as sign-in: the chrome and the
              // `_authed` guard must see the new session, not the stale read.
              await refreshSession();
              void navigate({ to: '/characters' });
            },
          },
        )
      }
      footer={
        <Link to="/" className="text-accent">
          {t('signUp.signInLink')}
        </Link>
      }
    />
  );
}
