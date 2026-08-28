// The Drizzle database handle. DatabaseModule binds it; DAOs and repositories
// inject it (architecture-api.md rule 34: the database is touched only from a
// repository or a DAO).
export const DATABASE = Symbol('DATABASE');
