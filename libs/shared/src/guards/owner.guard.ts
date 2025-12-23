import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { BoUser } from '../entities/backoffice';
import { BACKOFFICE_CONNECTION } from '../modules/database';
import { AuthenticatedRequest, AuthenticatedUser } from '../types';

@Injectable()
export class OwnerGuard implements CanActivate {
  constructor(
    @Inject(BACKOFFICE_CONNECTION)
    private readonly boConnection: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userFromToken = request.user as AuthenticatedUser;

    if (!userFromToken?.userId) {
      throw new UnauthorizedException();
    }

    if (!userFromToken.isOwner) {
      throw new ForbiddenException('Only owner users can access this resource');
    }

    const userRepository = this.boConnection.getRepository(BoUser);
    const user = await userRepository.findOne({
      where: { id: userFromToken.userId },
      relations: ['ownedTenantGroup', 'ownedTenantGroup.tenants'],
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    request.user = user;

    return true;
  }
}
