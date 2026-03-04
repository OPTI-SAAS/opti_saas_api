import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { TENANT_HEADER } from '../constants';
import { BoRole } from '../entities/backoffice';
import { ClUserRole } from '../entities/client';
import { BACKOFFICE_CONNECTION } from '../modules/database';
import { TenantRepositoryFactory } from '../modules/tenancy/tenant-repository.factory';
import { AuthenticatedUser } from '../types';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    @Inject(BACKOFFICE_CONNECTION)
    private readonly boConnection: DataSource,
    private readonly tenantRepoFactory: TenantRepositoryFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const rawUser = request.user;

    // JwtAuthGuard sets raw JWT payload (sub), while Passport strategy maps to userId
    const userId =
      rawUser && 'userId' in rawUser
        ? (rawUser as AuthenticatedUser).userId
        : rawUser && 'sub' in rawUser
          ? (rawUser as { sub: string }).sub
          : undefined;

    if (!userId) {
      throw new UnauthorizedException();
    }

    const tenantId = request.headers[TENANT_HEADER] as string | undefined;

    if (!tenantId) {
      throw new ForbiddenException(`Missing required header: ${TENANT_HEADER}`);
    }

    // Look up the user's role in the tenant schema (ClUserRole → ClRole)
    const userRole = await this.tenantRepoFactory.executeInTransaction(
      async (manager) => {
        const userRoleRepo = manager.getRepository(ClUserRole);
        return userRoleRepo.findOne({
          where: { userId },
          relations: ['role'],
        });
      },
      tenantId,
    );

    if (!userRole?.role) {
      throw new ForbiddenException('User does not have a role in this tenant');
    }

    // ClRole.parentId references the BoRole in the backoffice schema
    const parentRoleId = userRole.role.parentId;

    if (!parentRoleId) {
      throw new ForbiddenException('Only admin users can access this resource');
    }

    // Check if the parent backoffice role has isAdmin = true
    const roleRepository = this.boConnection.getRepository(BoRole);
    const role = await roleRepository.findOne({
      where: { id: parentRoleId },
      select: ['id', 'isAdmin'],
    });

    if (!role || !role.isAdmin) {
      throw new ForbiddenException('Only admin users can access this resource');
    }

    return true;
  }
}
