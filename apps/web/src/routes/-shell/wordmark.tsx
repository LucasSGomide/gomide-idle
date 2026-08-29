import { ACTIVE_SEASON, GAME_NAME } from '@/lib/brand';

// design.md §1 / naming.md rule 16: one non-wrapping line in Rajdhani — the game
// name bold, then ": ", then the active season in italic. Both strings come
// from the brand module and render identically in both languages; neither is a
// translation key.
export function Wordmark() {
  return (
    <span className="font-display text-xl tracking-heading whitespace-nowrap">
      <span className="font-bold">{GAME_NAME}</span>
      <span>: </span>
      <span className="font-medium italic">{ACTIVE_SEASON}</span>
    </span>
  );
}
