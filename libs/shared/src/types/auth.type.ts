import { Request } from 'express';

import { BoUser } from '../entities/backoffice';

export type JwtPayload = {
  sub: string;
  email: string;
};

export type AuthenticatedUser = {
  userId: string;
  email: string;
};

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser | BoUser;
  /**
   * The tenant ID extracted from the x-tenant-id header.
   */
  tenantId?: string;
}
