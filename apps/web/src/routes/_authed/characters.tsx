import { createFileRoute } from '@tanstack/react-router';

// wireframe 07: where a signed-in player lands — §1's Character-select row (the
// account menu, drawn by the shell's session-aware TopBar) over an empty body.
// The character list is the Character creation and selection item's; the empty
// body here is a decision, not a placeholder (it is not design.md §8's empty
// state — the region has no content yet by design, not content that failed to
// arrive).
export const Route = createFileRoute('/_authed/characters')({
  component: Characters,
});

function Characters() {
  return null;
}
