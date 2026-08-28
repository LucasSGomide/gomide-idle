// VIOLATION fixture: an integration test that builds its own table instead of
// running the project's migrations (FR.15.2). Never executed.
import { sql } from 'drizzle-orm';

export const badSetup = sql`CREATE TABLE ad_hoc_thing (id integer primary key)`;
