import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { AuthenticatedRequest, AuthenticatedUser } from '../types';

@Injectable()
export class RegularUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user as AuthenticatedUser;

    if (!user?.userId) {
      throw new UnauthorizedException();
    }

    if (user.isOwner) {
      throw new ForbiddenException('Owner users cannot access this resource');
    }

    return true;
  }
}
