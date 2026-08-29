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
import { useAuthControllerPostSignIn } from '@/lib/api/generated/tormented-path';

import { CredentialsForm } from './-auth/credentials-form';
import { toInternalPath } from './-auth/internal-path';

// wireframe 08: `/` is the sign-in screen, filling the body 02 reserved. A
// player who already has a session is redirected to /characters (auth.md
// rule 24). The `redirect` search param is validated as an internal path so it
// cannot become an open redirect.
export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  beforeLoad: async ({ context }) => {
    const session = await resolveSession(context.queryClient);
    if (session.user) throw redirect({ to: '/characters' });
  },
  component: SignIn,
});

function SignIn() {
  const { t } = useTranslation();
  const { redirect: target } = Route.useSearch();
  const navigate = useNavigate();
  const session = useSession();
  const refreshSession = useRefreshSession();
  const mutation = useAuthControllerPostSignIn();

  return (
    <CredentialsForm
      title={t('signIn.title')}
      submitLabel={t('signIn.submit')}
      pending={mutation.isPending}
      error={mutation.error ?? undefined}
      fieldForCode={{ INVALID_CREDENTIALS: 'password' }}
      onSubmit={({ email, password }) =>
        mutation.mutate(
          { data: { email, password } },
          {
            onSuccess: () => {
              refreshSession();
              void navigate({ to: toInternalPath(target) });
            },
          },
        )
      }
      footer={
        // The "Create one" link is removed, not disabled, when registration is
        // closed (wireframe 08).
        session.data?.registrationOpen ? (
          <Link to="/sign-up" className="text-accent">
            {t('signIn.createLink')}
          </Link>
        ) : null
      }
    />
  );
}
