// The shared pino instance. LoggingModule.register binds it; AppLogger and the
// exception filter inject it.
export const ROOT_LOGGER = Symbol('ROOT_LOGGER');
