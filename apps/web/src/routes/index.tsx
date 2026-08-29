import { createFileRoute } from '@tanstack/react-router';

// This is the first screen. `/` is the only route. design.md §1 specifies the
// signed-out top bar but no body for it — the login form that fills this belongs
// to the Account sign-up and login item. The empty body is a decision, not a
// placeholder: the shell stays when Account fills it, so nothing here is the
// throwaway FR.10.4 forbids.
export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  return null;
}
