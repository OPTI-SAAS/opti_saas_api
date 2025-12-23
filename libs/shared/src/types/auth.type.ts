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
  /**
   * The tenant ID extracted from the x-tenant-id header.
   * Populated by TenantGuard when the guard is used.
   */
  tenantId?: string;
}
