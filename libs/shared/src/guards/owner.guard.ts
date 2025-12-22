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

/**
 * Guard that only allows Owner users to access the resource.
 * Non-owner (tenant) users will receive a 403 Forbidden response.
 */
@Injectable()
export class OwnerGuard implements CanActivate {
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
      relations: ['ownedTenantGroup', 'ownedTenantGroup.tenants'],
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // Only allow owner users
    if (!user.isOwner) {
      throw new ForbiddenException('Only owner users can access this resource');
    }

    // Attach full user to request for later use
    request.fullUser = user;

    return true;
  }
}
