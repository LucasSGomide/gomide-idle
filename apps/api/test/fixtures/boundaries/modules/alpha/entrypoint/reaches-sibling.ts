// VIOLATION fixture: one module reaching into a sibling (stack-api rule 42).
import { betaThing } from '../../beta/domain/thing.js';

export const borrowed = betaThing;
