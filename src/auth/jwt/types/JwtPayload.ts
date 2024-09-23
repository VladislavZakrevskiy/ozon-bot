import { User } from '@prisma/client';

export interface JwtPayload {
  user: User;
}
