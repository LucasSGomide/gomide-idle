// VIOLATION fixture: an outward import (application -> infrastructure) written as
// type-only. It must still be caught (FR.12.3, tsPreCompilationDeps).
import type { TargetType } from '../infrastructure/target.js';

export const make = (id: string): TargetType => ({ id });
