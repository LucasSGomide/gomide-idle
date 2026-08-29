// Breaks ui-knows-no-feature: a ui/ file importing from features/.
import { alphaThing } from '../features/alpha/thing';
export const x = alphaThing;
