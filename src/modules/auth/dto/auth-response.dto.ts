import { RoleName } from '@prisma/client';

export type AuthUserResponse = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  roles: RoleName[];
};

export type AuthTokensResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUserResponse;
};
