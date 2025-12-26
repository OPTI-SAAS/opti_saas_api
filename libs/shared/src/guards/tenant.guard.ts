import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { TENANT_HEADER } from '../constants';
import { BoTenant, BoUser } from '../entities/backoffice';
import { BACKOFFICE_CONNECTION } from '../modules/database';
import { AuthenticatedRequest } from '../types';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    @Inject(BACKOFFICE_CONNECTION)
    private readonly boConnection: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const tenantId = request.headers[TENANT_HEADER] as string | undefined;

    if (!tenantId) {
      throw new BadRequestException(
        `Missing required header: ${TENANT_HEADER}`,
      );
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
      throw new BadRequestException(
        `Invalid tenant ID format: ${TENANT_HEADER} must be a valid UUID`,
      );
    }

    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const userId = 'userId' in user ? user.userId : user.id;

    // Verify tenant exists and user has access
    const hasAccess = await this.verifyTenantAccess(userId, tenantId);

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this tenant');
    }

    // Attach tenant ID to request for use in controllers/services
    (request as AuthenticatedRequest & { tenantId: string }).tenantId =
      tenantId;

    return true;
  }

  private async verifyTenantAccess(
    userId: string,
    tenantId: string,
  ): Promise<boolean> {
    const userRepository = this.boConnection.getRepository(BoUser);
    const tenantRepository = this.boConnection.getRepository(BoTenant);

    // First check if tenant exists
    const tenant = await tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new BadRequestException(`Tenant with id ${tenantId} not found`);
    }

    // Get user with their tenant memberships and owned tenant group
    const user = await userRepository.findOne({
      where: { id: userId },
      relations: [
        'tenantMemberships',
        'tenantMemberships.tenant',
        'ownedTenantGroup',
        'ownedTenantGroup.tenants',
      ],
    });

    if (!user) {
      return false;
    }

    // If user is owner, check if tenant belongs to their tenant group
    // FIXME: Temporarily disabled owner check logic
    // if (user.isOwner && user.ownedTenantGroup) {
    //   const ownerTenantIds =
    //     user.ownedTenantGroup.tenants?.map((t) => t.id) || [];
    //   return ownerTenantIds.includes(tenantId);
    // }

    // For regular users, check if they have membership in the tenant
    const userTenantIds = user.tenantMemberships?.map((m) => m.tenant.id) || [];
    return userTenantIds.includes(tenantId);
  }
}
