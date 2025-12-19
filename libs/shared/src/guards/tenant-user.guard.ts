import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { DataSource } from 'typeorm';

import { BoUser } from '../entities/backoffice';
import { BACKOFFICE_CONNECTION } from '../modules/database';

interface AuthenticatedRequest extends Request {
  user?: { userId: string; email: string };
  fullUser?: BoUser;
}

@Injectable()
export class TenantUserGuard implements CanActivate {
  constructor(
    @Inject(BACKOFFICE_CONNECTION)
    private readonly boConnection: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userFromToken = request.user;

    if (!userFromToken || !userFromToken.userId) {
      throw new ForbiddenException('User not authenticated');
    }

    const userRepository = this.boConnection.getRepository(BoUser);
    const user = await userRepository.findOne({
      where: { id: userFromToken.userId },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // Block owner users - only tenant users (non-owners) can access
    if (user.isOwner) {
      throw new ForbiddenException('Owner users cannot access this resource');
    }

    // Attach full user to request for later use
    request.fullUser = user;

    return true;
  }
}
