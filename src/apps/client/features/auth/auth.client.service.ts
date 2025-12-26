import {
  CLIENT_CONNECTION,
  ClRoleAuthorizationsView,
  ClUserRole,
  logcall,
} from '@lib/shared';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

@Injectable({ scope: Scope.REQUEST })
export class AuthClientService {
  private readonly clRoleAuthorizationsViewRepository: Repository<ClRoleAuthorizationsView>;
  private readonly clUserRoleRepository: Repository<ClUserRole>;

  constructor(@Inject(CLIENT_CONNECTION) connection: DataSource) {
    this.clRoleAuthorizationsViewRepository = connection.getRepository(
      ClRoleAuthorizationsView,
    );
    this.clUserRoleRepository = connection.getRepository(ClUserRole);
  }

  @logcall()
  async getUserOptions(userId: string) {
    const user = await this.clUserRoleRepository.findOne({
      where: { userId },
      select: ['roleId'],
    });
    if (!user) {
      throw new Error('User not found in tenant');
    }
    const roleAuthorizations =
      await this.clRoleAuthorizationsViewRepository.findOne({
        where: { roleId: user.roleId },
      });
    if (!roleAuthorizations) {
      throw new Error('Role authorizations not found');
    }
    return {
      authorizations: roleAuthorizations.authorizations,
    };
  }
}
