import {
  ClRoleAuthorizationsView,
  ClUserRole,
  logcall,
  TenantRepositoryFactory,
} from '@lib/shared';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthClientService {
  constructor(private readonly tenantRepoFactory: TenantRepositoryFactory) {}

  @logcall()
  async getUserOptions(userId: string) {
    // Execute within tenant context - schema is automatically set
    const authorizations = await this.tenantRepoFactory.executeInTransaction(
      async (manager) => {
        const clUserRoleRepository = manager.getRepository(ClUserRole);
        const clRoleAuthorizationsViewRepository = manager.getRepository(
          ClRoleAuthorizationsView,
        );

        const user = await clUserRoleRepository.findOne({
          where: { userId },
          select: ['roleId'],
        });
        if (!user) {
          throw new Error('User not found in tenant');
        }

        const roleAuthorizations =
          await clRoleAuthorizationsViewRepository.findOne({
            where: { roleId: user.roleId },
          });
        if (!roleAuthorizations) {
          throw new Error('Role authorizations not found');
        }

        return roleAuthorizations.authorizations;
      },
    );
    return { authorizations };
  }
}
