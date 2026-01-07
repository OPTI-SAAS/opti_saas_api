import {
  BACKOFFICE_CONNECTION,
  BoTenant,
  BoUser,
  BoUserTenant,
  ClRole,
  ClUserRole,
  handleDbError,
  PaginationQueryDto,
  TenantRepositoryFactory,
} from '@lib/shared';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';

import { AssignRoleDto, CreateUserDto, UpdateUserDto } from './dto';
import { TenantWithRoleDto } from './dto/user-response.dto';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasPrev: boolean;
  hasNext: boolean;
}

@Injectable()
export class UsersService {
  private readonly userRepository: Repository<BoUser>;
  private readonly userTenantRepository: Repository<BoUserTenant>;
  private readonly tenantRepository: Repository<BoTenant>;

  constructor(
    @Inject(BACKOFFICE_CONNECTION)
    private readonly boConnection: DataSource,
    private readonly tenantRepoFactory: TenantRepositoryFactory,
  ) {
    this.userRepository = this.boConnection.getRepository(BoUser);
    this.userTenantRepository = this.boConnection.getRepository(BoUserTenant);
    this.tenantRepository = this.boConnection.getRepository(BoTenant);
  }

  // ==================== HELPER METHODS ====================

  private buildPaginationMeta(
    page: number,
    limit: number,
    total: number,
  ): PaginationMeta {
    const pages = Math.ceil(total / limit);
    return {
      page,
      limit,
      total,
      pages,
      hasPrev: page > 1,
      hasNext: page < pages,
    };
  }

  /**
   * Get the tenantGroupId for a user
   */
  private async getUserTenantGroupId(userId: string): Promise<string> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'tenantGroupId'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.tenantGroupId) {
      throw new BadRequestException('User is not assigned to any tenant group');
    }

    return user.tenantGroupId;
  }

  /**
   * Get all tenants for a tenant group
   */
  private async getTenantsByGroupId(
    tenantGroupId: string,
  ): Promise<BoTenant[]> {
    return this.tenantRepository.find({
      where: { tenantGroupId },
      select: ['id', 'name', 'dbSchema'],
    });
  }

  /**
   * Verify user belongs to the same tenant group as the requester
   */
  private async verifyUserInSameTenantGroup(
    targetUserId: string,
    requesterTenantGroupId: string,
  ): Promise<BoUser> {
    const user = await this.userRepository.findOne({
      where: { id: targetUserId },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${targetUserId} not found`);
    }

    if (user.tenantGroupId !== requesterTenantGroupId) {
      throw new ForbiddenException('User does not belong to your tenant group');
    }

    return user;
  }

  // ==================== TASK 1: POST /users ====================
  /**
   * Create a new user WITHOUT assigning any role or tenant
   * Returns BoUser entity - @Exclude handles serialization
   */
  async create(
    createUserDto: CreateUserDto,
    currentUserId: string,
  ): Promise<BoUser> {
    const { firstName, lastName, email, password } = createUserDto;

    // Check if user with this email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Get the tenant group of the current user
    const tenantGroupId = await this.getUserTenantGroupId(currentUserId);

    // Create new user
    const user = new BoUser();
    user.firstName = firstName;
    user.lastName = lastName ?? '';
    user.email = email;
    user.tenantGroupId = tenantGroupId;
    await user.setPassword(password);

    try {
      return await this.userRepository.save(user);
    } catch (error) {
      handleDbError(error);
    }
  }

  // ==================== TASK 2: GET /users ====================
  /**
   * Get all users in the same tenant group (not filtered by selected tenant)
   * Returns BoUser entities with tenants and roles - @Exclude handles serialization
   */
  async findAll(
    query: PaginationQueryDto,
    currentUserId: string,
  ): Promise<{
    data: (BoUser & { tenants: TenantWithRoleDto[] })[];
    meta: PaginationMeta;
  }> {
    const { page = 1, limit = 10 } = query;

    // Get the tenant group of the current user
    const tenantGroupId = await this.getUserTenantGroupId(currentUserId);

    // Get all users in the same tenant group with pagination
    const [users, total] = await this.userRepository.findAndCount({
      where: { tenantGroupId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    if (users.length === 0) {
      return { data: [], meta: this.buildPaginationMeta(page, limit, 0) };
    }

    // Get all user IDs
    const userIds = users.map((u) => u.id);

    // Get user-tenant relationships for all users in one query
    const userTenants = await this.userTenantRepository.find({
      where: { userId: In(userIds) },
      relations: ['tenant'],
    });

    // Get all tenants in this tenant group for role lookups
    const groupTenants = await this.getTenantsByGroupId(tenantGroupId);
    const tenantSchemaMap = new Map<string, string>(
      groupTenants.map((t) => [t.id, t.dbSchema]),
    );

    // Build user -> tenant -> role mapping
    const tenantsByUserId = new Map<string, TenantWithRoleDto[]>();

    for (const ut of userTenants) {
      const tenantId = ut.tenant.id;
      const userId = ut.userId;
      const dbSchema = tenantSchemaMap.get(tenantId);

      let role: { id: string; name: string } | undefined;

      if (dbSchema) {
        try {
          // Query the tenant's schema for user's role using ALS
          const userRole = await this.tenantRepoFactory.executeInTransaction(
            async (manager) => {
              await manager.query(
                `SET LOCAL search_path TO "${dbSchema}", public;`,
              );

              const userRoleRepo = manager.getRepository(ClUserRole);
              const clRoleRepo = manager.getRepository(ClRole);

              const userRoleRecord = await userRoleRepo.findOne({
                where: { userId },
                select: ['roleId'],
              });

              if (userRoleRecord) {
                const roleRecord = await clRoleRepo.findOne({
                  where: { id: userRoleRecord.roleId },
                  select: ['id', 'name'],
                });
                return roleRecord;
              }
              return null;
            },
          );

          if (userRole) {
            role = { id: userRole.id, name: userRole.name };
          }
        } catch {
          // If tenant schema query fails, continue without role
        }
      }

      if (!tenantsByUserId.has(userId)) {
        tenantsByUserId.set(userId, []);
      }
      tenantsByUserId.get(userId)!.push({
        id: ut.tenant.id,
        name: ut.tenant.name,
        role,
      });
    }

    // Attach tenants with roles to users
    const data = users.map((user) =>
      Object.assign(user, { tenants: tenantsByUserId.get(user.id) ?? [] }),
    );

    const meta = this.buildPaginationMeta(page, limit, total);
    if (meta.pages !== 0 && page > meta.pages) {
      throw new NotFoundException(
        `Page ${page} is out of range. There are only ${meta.pages} page(s) available.`,
      );
    }

    return { data, meta };
  }

  // ==================== TASK 3: PATCH /users/:id ====================
  /**
   * Update user information only (firstName, lastName, password)
   * Returns BoUser entity - @Exclude handles serialization
   */
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    currentUserId: string,
  ): Promise<BoUser> {
    // Get requester's tenant group
    const tenantGroupId = await this.getUserTenantGroupId(currentUserId);

    // Verify target user is in same tenant group
    const user = await this.verifyUserInSameTenantGroup(id, tenantGroupId);

    const { firstName, lastName, password, currentPassword } = updateUserDto;

    // Validate at least one field is being updated
    if (
      firstName === undefined &&
      lastName === undefined &&
      password === undefined
    ) {
      throw new BadRequestException(
        'At least one field must be provided for update',
      );
    }

    // Update basic info
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;

    // Handle password update
    if (password !== undefined) {
      // Only the user themselves can change their password
      if (currentUserId !== id) {
        throw new ForbiddenException(
          'Only the user can change their own password',
        );
      }

      if (!currentPassword) {
        throw new BadRequestException(
          'Current password is required to change password',
        );
      }

      const isCurrentPasswordValid = await user.checkPassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new ForbiddenException('Current password is incorrect');
      }

      await user.setPassword(password);
    }

    try {
      return await this.userRepository.save(user);
    } catch (error) {
      handleDbError(error);
    }
  }

  // ==================== TASK 4: GET /users/:id ====================
  /**
   * Get one user with their tenants and roles (not filtered by selected tenant)
   * Returns BoUser entity with tenants - @Exclude handles serialization
   */
  async findOne(
    id: string,
    currentUserId: string,
  ): Promise<BoUser & { tenants: TenantWithRoleDto[] }> {
    // Get requester's tenant group
    const tenantGroupId = await this.getUserTenantGroupId(currentUserId);

    // Verify target user is in same tenant group
    const user = await this.verifyUserInSameTenantGroup(id, tenantGroupId);

    // Get all tenants this user belongs to
    const userTenants = await this.userTenantRepository.find({
      where: { userId: id },
      relations: ['tenant'],
    });

    // Get all tenants in this tenant group for role lookups
    const groupTenants = await this.getTenantsByGroupId(tenantGroupId);

    // Build tenant-role map by querying each tenant schema for user's role
    const tenantsWithRoles: TenantWithRoleDto[] = [];

    for (const ut of userTenants) {
      const tenant = ut.tenant;
      let role: { id: string; name: string } | undefined;

      // Find the tenant in group tenants to get dbSchema
      const tenantInfo = groupTenants.find((t) => t.id === tenant.id);

      if (tenantInfo) {
        try {
          // Query the tenant's schema for user's role using ALS
          const userRole = await this.tenantRepoFactory.executeInTransaction(
            async (manager) => {
              // Set the schema for this specific tenant
              await manager.query(
                `SET LOCAL search_path TO "${tenantInfo.dbSchema}", public;`,
              );

              const userRoleRepo = manager.getRepository(ClUserRole);
              const clRoleRepo = manager.getRepository(ClRole);

              const userRoleRecord = await userRoleRepo.findOne({
                where: { userId: id },
                select: ['roleId'],
              });

              if (userRoleRecord) {
                const roleRecord = await clRoleRepo.findOne({
                  where: { id: userRoleRecord.roleId },
                  select: ['id', 'name'],
                });
                return roleRecord;
              }
              return null;
            },
          );

          if (userRole) {
            role = { id: userRole.id, name: userRole.name };
          }
        } catch {
          // If tenant schema query fails, continue without role
        }
      }

      tenantsWithRoles.push({
        id: tenant.id,
        name: tenant.name,
        role,
      });
    }

    return Object.assign(user, { tenants: tenantsWithRoles });
  }

  // ==================== TASK 5: PUT /users/:user_id/assign_role ====================
  /**
   * Assign roles to a user in multiple tenants
   * Payload: { assignments: [{ tenant_id, role_id }, ...] }
   */
  async assignRoles(
    userId: string,
    assignRoleDto: AssignRoleDto,
    currentUserId: string,
  ): Promise<{
    message: string;
    assignments: { tenant_id: string; role_id: string; success: boolean }[];
  }> {
    // Get requester's tenant group
    const tenantGroupId = await this.getUserTenantGroupId(currentUserId);

    // Verify target user is in same tenant group
    await this.verifyUserInSameTenantGroup(userId, tenantGroupId);

    // Get all tenants in this tenant group
    const groupTenants = await this.getTenantsByGroupId(tenantGroupId);
    const groupTenantIds = new Set<string>(groupTenants.map((t) => t.id));
    const tenantSchemaMap = new Map<string, string>(
      groupTenants.map((t) => [t.id, t.dbSchema]),
    );

    // Validate all tenant IDs belong to the same tenant group
    for (const assignment of assignRoleDto.assignments) {
      const tenantId: string = assignment.tenant_id;
      if (!groupTenantIds.has(tenantId)) {
        throw new BadRequestException(
          `Tenant with id ${tenantId} does not belong to your tenant group`,
        );
      }
    }

    // Process each assignment
    const results: { tenant_id: string; role_id: string; success: boolean }[] =
      [];

    for (const assignment of assignRoleDto.assignments) {
      const tenantId: string = assignment.tenant_id;
      const roleId: string = assignment.role_id;
      const dbSchema = tenantSchemaMap.get(tenantId)!;

      try {
        await this.tenantRepoFactory.executeInTransaction(async (manager) => {
          // Set the schema for this specific tenant
          await manager.query(
            `SET LOCAL search_path TO "${dbSchema}", public;`,
          );

          const userRoleRepo = manager.getRepository(ClUserRole);
          const clRoleRepo = manager.getRepository(ClRole);

          // Verify the role exists in this tenant's schema
          const roleExists = await clRoleRepo.findOne({
            where: { id: roleId },
            select: ['id'],
          });

          if (!roleExists) {
            throw new NotFoundException(
              `Role with id ${roleId} not found in tenant ${tenantId}`,
            );
          }

          // Check if user already has a role in this tenant
          const existingUserRole = await userRoleRepo.findOne({
            where: { userId },
            select: ['id'],
          });

          if (existingUserRole) {
            // Update existing role
            await userRoleRepo.update(existingUserRole.id, {
              roleId,
            });
          } else {
            // Create new role assignment
            const newUserRole = userRoleRepo.create({
              userId,
              roleId,
            });
            await userRoleRepo.save(newUserRole);
          }
        });

        // Also ensure user is assigned to this tenant in backoffice.user_tenants
        const existingUserTenant = await this.userTenantRepository.findOne({
          where: { userId, tenantId },
        });

        if (!existingUserTenant) {
          const userTenant = new BoUserTenant();
          userTenant.userId = userId;
          userTenant.tenantId = tenantId;
          await this.userTenantRepository.save(userTenant);
        }

        results.push({
          tenant_id: tenantId,
          role_id: roleId,
          success: true,
        });
      } catch (error) {
        // Re-throw NotFoundException for invalid role
        if (error instanceof NotFoundException) {
          throw error;
        }
        // Handle DB errors
        handleDbError(error);
      }
    }

    return {
      message: 'Role assignments processed successfully',
      assignments: results,
    };
  }
}
