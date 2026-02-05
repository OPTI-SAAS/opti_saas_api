import {
  BACKOFFICE_CONNECTION,
  BoTenant,
  BoUser,
  BoUserTenant,
  ClRole,
  ClUserRole,
  handleDbError,
  PaginationQueryDto,
  TenantDataSourceManager,
} from '@lib/shared';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { AssignRoleDto, CreateUserDto, UpdateUserDto } from './dto';
import { TenantWithRoleDto } from './dto/user-response.dto';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly userRepository: Repository<BoUser>;
  private readonly userTenantRepository: Repository<BoUserTenant>;
  private readonly tenantRepository: Repository<BoTenant>;

  constructor(
    @Inject(BACKOFFICE_CONNECTION)
    private readonly boConnection: DataSource,
    private readonly tenantDataSourceManager: TenantDataSourceManager,
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
   * Verify that two users belong to the same tenant group
   * Returns both users if verification passes
   */
  private async verifyUsersInSameTenantGroup(
    currentUserId: string,
    targetUserId: string,
  ): Promise<{ currentUser: BoUser; targetUser: BoUser }> {
    const [currentUser, targetUser] = await Promise.all([
      this.userRepository.findOne({
        where: { id: currentUserId },
        select: ['id', 'tenantGroupId'],
      }),
      this.userRepository.findOne({
        where: { id: targetUserId },
      }),
    ]);

    if (!currentUser) {
      throw new NotFoundException('Current user not found');
    }

    if (!currentUser.tenantGroupId) {
      throw new BadRequestException(
        'Current user is not assigned to any tenant group',
      );
    }

    if (!targetUser) {
      throw new NotFoundException(`User with id ${targetUserId} not found`);
    }

    if (targetUser.tenantGroupId !== currentUser.tenantGroupId) {
      throw new ForbiddenException('User does not belong to your tenant group');
    }

    return { currentUser, targetUser };
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
   * Returns BoUser entities only - no tenant/role info for list view
   */
  async findAll(
    query: PaginationQueryDto,
    currentUserId: string,
  ): Promise<{
    data: BoUser[];
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

    const meta = this.buildPaginationMeta(page, limit, total);
    if (meta.pages !== 0 && page > meta.pages) {
      throw new NotFoundException(
        `Page ${page} is out of range. There are only ${meta.pages} page(s) available.`,
      );
    }

    return { data: users, meta };
  }

  // ==================== TASK 3: PATCH /users/:id ====================
  /**
   * Update user information only (firstName, lastName)
   * Returns BoUser entity - @Exclude handles serialization
   */
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    currentUserId: string,
  ): Promise<BoUser> {
    // Verify both users exist and belong to the same tenant group
    const { targetUser: user } = await this.verifyUsersInSameTenantGroup(
      currentUserId,
      id,
    );

    const { firstName, lastName } = updateUserDto;

    // Validate at least one field is being updated
    if (firstName === undefined && lastName === undefined) {
      throw new BadRequestException(
        'At least one field must be provided for update',
      );
    }

    // Update basic info
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;

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
    // Verify both users exist and belong to the same tenant group
    const { currentUser, targetUser: user } =
      await this.verifyUsersInSameTenantGroup(currentUserId, id);

    // Get all tenants this user belongs to
    const userTenants = await this.userTenantRepository.find({
      where: { userId: id },
      select: ['tenantId'],
    });

    if (userTenants.length === 0) {
      return Object.assign(user, { tenants: [] });
    }

    // Get all tenants in this tenant group for role lookups
    const groupTenants = await this.getTenantsByGroupId(
      currentUser.tenantGroupId,
    );
    const tenantSchemaMap = new Map<string, string>(
      groupTenants.map((t) => [t.id, t.dbSchema]),
    );

    // Build tenant-role map by querying each tenant schema for user's role
    const tenantsWithRoles: TenantWithRoleDto[] = await Promise.all(
      userTenants.map(async (ut) => {
        const tenantId = ut.tenantId;
        const dbSchema = tenantSchemaMap.get(tenantId);

        if (!dbSchema) {
          return { id: tenantId, roleId: undefined };
        }

        let roleId: string | undefined;

        try {
          // Query the tenant's schema for user's role
          const userRole =
            await this.tenantDataSourceManager.executeInTransaction(
              async (manager) => {
                const userRoleRepo = manager.getRepository(ClUserRole);
                const userRoleRecord = await userRoleRepo.findOne({
                  where: { userId: id },
                  select: ['roleId'],
                });
                return userRoleRecord;
              },
              tenantId,
            );

          if (userRole) {
            roleId = userRole.roleId;
          }
        } catch (error) {
          // Log error but continue without role to provide partial data
          this.logger.warn(
            `Failed to fetch role for user ${id} in tenant ${tenantId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }

        return { id: tenantId, roleId };
      }),
    );

    return Object.assign(user, { tenants: tenantsWithRoles });
  }

  // ==================== TASK 5: PUT /users/:id/assign-roles ====================
  /**
   * Assign roles to a user in multiple tenants
   * Two-layer approach:
   * - Layer 1 [data]: Compute tenants_to_delete, tenants_to_add, tenants_with_no_changes
   * - Layer 1 [action]: Update BoUserTenant table (delete/add)
   * - Layer 2 [data]: Use tenants_to_add + tenants_with_no_changes
   * - Layer 2 [action]: Assign/update roles in tenant schemas
   */
  async assignRoles(
    userId: string,
    assignRoleDto: AssignRoleDto,
    currentUserId: string,
  ): Promise<{
    message: string;
    assignments: { tenantId: string; roleId: string; success: boolean }[];
  }> {
    // Verify both users exist and belong to the same tenant group
    const { currentUser } = await this.verifyUsersInSameTenantGroup(
      currentUserId,
      userId,
    );

    // Get all tenants in this tenant group
    const groupTenants = await this.getTenantsByGroupId(
      currentUser.tenantGroupId,
    );
    const groupTenantIds = new Set<string>(groupTenants.map((t) => t.id));

    // Validate all tenant IDs in request belong to the same tenant group
    for (const assignment of assignRoleDto.assignments) {
      const { tenantId } = assignment;
      if (!groupTenantIds.has(tenantId)) {
        throw new BadRequestException(
          `Tenant with id ${tenantId} does not belong to your tenant group`,
        );
      }
    }

    // ==================== LAYER 1 [DATA] ====================
    // Get user's current tenant assignments
    const existingUserTenants = await this.userTenantRepository.find({
      where: { userId },
      select: ['id', 'tenantId'],
    });
    const existingTenantIds = new Set<string>(
      existingUserTenants.map((ut) => ut.tenantId),
    );

    // Requested tenant IDs from the DTO
    const requestedTenantIds = new Set<string>(
      assignRoleDto.assignments.map((a) => a.tenantId),
    );

    // Compute the three categories
    const tenantsToDelete = existingUserTenants.filter(
      (ut) => !requestedTenantIds.has(ut.tenantId),
    );
    const tenantsToAdd = assignRoleDto.assignments.filter(
      (a) => !existingTenantIds.has(a.tenantId),
    );
    const tenantsWithNoChanges = assignRoleDto.assignments.filter((a) =>
      existingTenantIds.has(a.tenantId),
    );

    // ==================== LAYER 1 [ACTION] ====================
    // Delete user from tenants no longer in the assignment
    if (tenantsToDelete.length > 0) {
      const idsToDelete = tenantsToDelete.map((ut) => ut.id);
      await this.userTenantRepository.delete(idsToDelete);

      // Also remove user roles from those tenant schemas (in parallel)
      await Promise.all(
        tenantsToDelete.map(async (ut) => {
          try {
            await this.tenantDataSourceManager.executeInTransaction(
              async (manager) => {
                const userRoleRepo = manager.getRepository(ClUserRole);
                await userRoleRepo.delete({ userId });
              },
              ut.tenantId,
            );
          } catch (error) {
            // Log error but continue to process other tenants
            this.logger.warn(
              `Failed to delete role for user ${userId} in tenant ${ut.tenantId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
          }
        }),
      );
    }

    // Add user to new tenants
    if (tenantsToAdd.length > 0) {
      const newUserTenants = tenantsToAdd.map((a) => {
        const userTenant = new BoUserTenant();
        userTenant.userId = userId;
        userTenant.tenantId = a.tenantId;
        return userTenant;
      });
      await this.userTenantRepository.save(newUserTenants);
    }

    // ==================== LAYER 2 [DATA & ACTION] ====================
    const results: { tenantId: string; roleId: string; success: boolean }[] =
      [];

    // Process tenantsToAdd: assign new roles
    for (const assignment of tenantsToAdd) {
      const { tenantId, roleId } = assignment;

      try {
        await this.tenantDataSourceManager.executeInTransaction(
          async (manager) => {
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

            // Create new role assignment
            const newUserRole = userRoleRepo.create({ userId, roleId });
            await userRoleRepo.save(newUserRole);
          },
          tenantId,
        );

        results.push({ tenantId, roleId, success: true });
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }
        handleDbError(error);
      }
    }

    // Process tenantsWithNoChanges: check if role changed and update if needed
    for (const assignment of tenantsWithNoChanges) {
      const { tenantId, roleId } = assignment;

      try {
        await this.tenantDataSourceManager.executeInTransaction(
          async (manager) => {
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

            // Check existing role
            const existingUserRole = await userRoleRepo.findOne({
              where: { userId },
              select: ['id', 'roleId'],
            });

            if (existingUserRole) {
              // Only update if role is different
              if (existingUserRole.roleId !== roleId) {
                await userRoleRepo.update(existingUserRole.id, { roleId });
              }
            } else {
              // No role exists, create one
              const newUserRole = userRoleRepo.create({ userId, roleId });
              await userRoleRepo.save(newUserRole);
            }
          },
          tenantId,
        );

        results.push({ tenantId, roleId, success: true });
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }
        handleDbError(error);
      }
    }

    return {
      message: 'Role assignments processed successfully',
      assignments: results,
    };
  }
}
