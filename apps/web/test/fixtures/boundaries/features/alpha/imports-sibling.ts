// Breaks no-cross-feature-import: alpha reaching into beta.
import { betaThing } from '../beta/thing';
export const x = betaThing;
