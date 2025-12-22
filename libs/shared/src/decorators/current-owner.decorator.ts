import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

import { BoUser } from '../entities/backoffice';

interface RequestWithOwner extends Request {
  fullUser?: BoUser;
}

/**
 * Decorator to extract the full user object from the request.
 * This is populated by the OwnerGuard and includes relations like ownedTenantGroup.
 */
export const CurrentOwner = createParamDecorator(
  (data: unknown, context: ExecutionContext): BoUser => {
    const request = context.switchToHttp().getRequest<RequestWithOwner>();
    return request.fullUser as BoUser;
  },
);
