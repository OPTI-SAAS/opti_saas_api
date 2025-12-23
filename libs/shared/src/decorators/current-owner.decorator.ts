import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

import { BoUser } from '../entities/backoffice';
import { AuthenticatedRequest } from '../types';

export const CurrentOwner = createParamDecorator(
  (data: unknown, context: ExecutionContext): BoUser => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user as BoUser | undefined;

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  },
);
