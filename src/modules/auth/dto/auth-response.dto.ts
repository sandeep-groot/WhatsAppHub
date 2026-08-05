import { RoleName } from '@prisma/client';

export type AuthUserResponse = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  roles: RoleName[];
};

/** Returned to the client after login/refresh — tokens live in HttpOnly cookies. */
export type AuthSessionResponse = {
  user: AuthUserResponse;
};

/** Internal result from token issuance (cookies set by the controller). */
export type IssuedAuthTokens = {
  accessToken: string;
  refreshToken: string;
  user: AuthUserResponse;
  rememberMe?: boolean;
};
