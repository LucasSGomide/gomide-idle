import { SetMetadata } from '@nestjs/common';

// auth.md rules 11-13: the session guard is global and public routes are the
// exception, marked with this one decorator. It lives here rather than in the
// auth module so a controller in any module (server-meta is system's) can opt
// out without importing across a module boundary.
export const IS_PUBLIC_KEY = 'auth:isPublic';

export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(IS_PUBLIC_KEY, true);
