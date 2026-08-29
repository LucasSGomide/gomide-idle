// Breaks renderer-admits-only-the-theme-module: renderer/ importing from lib/.
import { util } from '../lib/util';
export const x = util;
