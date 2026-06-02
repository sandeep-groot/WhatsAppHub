import { RoleName } from '@prisma/client';

export type AuthenticatedUser = {
  id: string;
  email: string;
  roles: RoleName[];
};
