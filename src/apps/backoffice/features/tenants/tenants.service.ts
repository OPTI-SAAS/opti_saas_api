import {
  BACKOFFICE_CONNECTION,
  BoOwner,
  BoRole,
  BoTenant,
  BoTenantGroup,
  BoUser,
  BoUserTenant,
  ClRole,
  ClUserRole,
  getTenantConnection,
} from '@lib/shared';
import { Inject, Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import { CreateTenantWithOwnerDto } from './dto/create-tenant-with-owner.dto';

@Injectable()
export class TenantsService {
  constructor(
    @Inject(BACKOFFICE_CONNECTION) private readonly dataSource: DataSource,
  ) {}

  async createTenantWithOwner(
    createTenantWithOwnerDto: CreateTenantWithOwnerDto,
  ) {
    const { tenant, adminUser } = await this.dataSource.transaction(
      async (manager) => {
        const ownerRepository = manager.getRepository(BoOwner);
        const tenantGroupRepository = manager.getRepository(BoTenantGroup);
        const tenantRepository = manager.getRepository(BoTenant);
        const userRepository = manager.getRepository(BoUser);
        const userTenantRepository = manager.getRepository(BoUserTenant);

        let createdOwner = ownerRepository.create({
          firstName: createTenantWithOwnerDto.firstName,
          lastName: createTenantWithOwnerDto.lastName,
          email: createTenantWithOwnerDto.email,
        });
        await createdOwner.setPassword(createTenantWithOwnerDto.password);
        createdOwner = await ownerRepository.save(createdOwner);

        let createdTenantGroup = tenantGroupRepository.create({
          ownerId: createdOwner.id,
        });
        createdTenantGroup =
          await tenantGroupRepository.save(createdTenantGroup);

        let createdTenant = tenantRepository.create({
          name: createTenantWithOwnerDto.tenantName,
          tenantGroupId: createdTenantGroup.id,
        });

        let createdAdminUser = userRepository.create({
          firstName: createTenantWithOwnerDto.firstName,
          lastName: createTenantWithOwnerDto.lastName,
          email: createTenantWithOwnerDto.adminEmail,
          tenantGroupId: createdTenantGroup.id,
        });
        await createdAdminUser.setPassword(
          createTenantWithOwnerDto.adminPassword,
        );
        [createdAdminUser, createdTenant] = await Promise.all([
          userRepository.save(createdAdminUser),
          tenantRepository.save(createdTenant),
        ]);
        await userTenantRepository.save({
          tenantId: createdTenant.id,
          userId: createdAdminUser.id,
        });
        return { tenant: createdTenant, adminUser: createdAdminUser };
      },
    );
    const clAdminUser = await this.setupTenant(tenant, adminUser);
    return { tenant, adminUser, clAdminUser };
  }

  async getTenantSchemaDataSource(tenant: BoTenant): Promise<DataSource> {
    // create just the schema for now
    await this.dataSource.query(
      `CREATE SCHEMA IF NOT EXISTS "${tenant.dbSchema}";`,
    );
    const tenantDataSource = await getTenantConnection(tenant.id, true);
    return tenantDataSource;
  }

  async setupTenant(tenant: BoTenant, adminUser: BoUser) {
    const tenantDataSource = await this.getTenantSchemaDataSource(tenant);
    const clAdminUser = await tenantDataSource.transaction(async (manager) => {
      const clAdminRole = await this.setupTenantRoles(manager);
      if (!clAdminRole) {
        throw new Error('Failed to setup client admin role for tenant');
      }
      const userRoleRepository = manager.getRepository(ClUserRole);
      const assignedUserToTenantAsAdmin = userRoleRepository.create({
        roleId: clAdminRole.id,
        userId: adminUser.id,
      });
      const clAdminUser = await userRoleRepository.save(
        assignedUserToTenantAsAdmin,
      );
      return clAdminUser;
    });
    return clAdminUser;
  }

  async setupTenantRoles(manager: EntityManager) {
    const boRoleRepository = manager.getRepository(BoRole);

    const adminRole = await boRoleRepository.findOne({
      where: { isAdmin: true },
    });
    if (!adminRole) {
      throw new Error('Admin role not found in backoffice roles setup');
    }
    const clRoleRepository = manager.getRepository(ClRole);

    // copy backoffice roles to client roles
    const boRoles = await boRoleRepository.find();
    const clRoles = await clRoleRepository.save(
      boRoles.map((boRole) => {
        const clRole = clRoleRepository.create();
        clRole.name = boRole.name;
        clRole.parentId = boRole.id;
        return clRole;
      }),
    );
    const adminClRole = clRoles.find((role) => role.parentId === adminRole.id);
    return adminClRole;
  }

  async createTenant(tenantName: string, userId: string) {
    const { tenant, adminUser } = await this.dataSource.transaction(
      async (manager) => {
        const userRepository = manager.getRepository(BoUser);
        const tenantRepository = manager.getRepository(BoTenant);
        const userTenantRepository = manager.getRepository(BoUserTenant);
        const user = await userRepository.findOne({ where: { id: userId } });
        if (!user) {
          throw new Error('User not found');
        }
        let createdTenant = tenantRepository.create({
          name: tenantName,
          tenantGroupId: user.tenantGroupId,
        });
        createdTenant = await tenantRepository.save(createdTenant);
        const userTenant = userTenantRepository.create({
          tenantId: createdTenant.id,
          userId,
        });
        await userTenantRepository.save(userTenant);
        return { tenant: createdTenant, adminUser: user };
      },
    );
    const clAdminUser = await this.setupTenant(tenant, adminUser);
    return { tenant, adminUser, clAdminUser };
  }
}
