import type { AuthenticatedUser } from '../modules/auth/types/authenticated-user.type';

declare module 'express-serve-static-core' {
  interface Request {
    correlationId?: string;
    user?: AuthenticatedUser;
  }
}

export {};
