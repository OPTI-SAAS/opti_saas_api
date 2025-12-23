import { Request } from 'express';

import { BoUser } from '../entities/backoffice';

export type JwtPayload = {
  sub: string;
  email: string;
  isOwner: boolean;
};

export type AuthenticatedUser = {
  userId: string;
  email: string;
  isOwner: boolean;
};

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser | BoUser;
}
