import {
  BACKOFFICE_CONNECTION,
  BoUser,
  BoUserTenant,
  PaginationQueryDto,
} from '@lib/shared';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { CreateUserDto, UpdateUserDto } from './dto';

@Injectable()
export class UsersService {
  private userRepository: Repository<BoUser>;
  private userTenantRepository: Repository<BoUserTenant>;

  constructor(
    @Inject(BACKOFFICE_CONNECTION)
    private readonly boConnection: DataSource,
  ) {
    this.userRepository = this.boConnection.getRepository(BoUser);
    this.userTenantRepository = this.boConnection.getRepository(BoUserTenant);
  }

  private mapUserToResponse(user: BoUser) {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isOwner: user.isOwner,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt || null,
      tenants:
        user.tenantMemberships?.map((m) => ({
          id: m.tenant.id,
          name: m.tenant.name,
          dbSchema: m.tenant.dbSchema,
        })) || [],
    };
  }

  private buildPaginationMeta(page: number, limit: number, total: number) {
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

  private emptyPaginatedResponse(page: number, limit: number) {
    return { data: [], meta: this.buildPaginationMeta(page, limit, 0) };
  }

  private getAccessibleTenantIds(user: BoUser): string[] {
    if (user.isOwner && user.ownedTenantGroup) {
      return user.ownedTenantGroup.tenants?.map((t) => t.id) || [];
    }
    return user.tenantMemberships?.map((m) => m.tenant.id) || [];
  }

  private async findPaginatedUsersByTenants(
    tenantIds: string[],
    page: number,
    limit: number,
  ) {
    if (tenantIds.length === 0) {
      return this.emptyPaginatedResponse(page, limit);
    }

    // Single query with subquery - avoids N+1 problem
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.tenantMemberships', 'membership')
      .leftJoinAndSelect('membership.tenant', 'tenant')
      .where('user.isOwner = :isOwner', { isOwner: false })
      .andWhere(
        `user.id IN (
          SELECT DISTINCT ut."userId" 
          FROM bo_user_tenant ut 
          WHERE ut."tenantId" IN (:...tenantIds)
        )`,
        { tenantIds },
      )
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    const meta = this.buildPaginationMeta(page, limit, total);
    if (meta.pages !== 0 && page > meta.pages) {
      throw new NotFoundException(
        `Page ${page} is out of range. There are only ${meta.pages} page(s) available.`,
      );
    }

    return { data: data.map((u) => this.mapUserToResponse(u)), meta };
  }

  private async findUserWithRelations(id: string): Promise<BoUser | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['tenantMemberships', 'tenantMemberships.tenant'],
    });
  }

  private async findCurrentUser(userId: string): Promise<BoUser> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: [
        'tenantMemberships',
        'tenantMemberships.tenant',
        'ownedTenantGroup',
        'ownedTenantGroup.tenants',
      ],
    });

    if (!user) {
      throw new NotFoundException('Current user not found');
    }

    return user;
  }

  async create(createUserDto: CreateUserDto, owner: BoUser) {
    const { firstName, lastName, email, password, tenantIds } = createUserDto;

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    if (tenantIds?.length) {
      this.validateTenantIds(tenantIds, owner);
    }

    const user = new BoUser();
    Object.assign(user, { firstName, lastName, email, isOwner: false });
    await user.setPassword(password);

    const savedUser = await this.userRepository.save(user);

    if (tenantIds?.length) {
      await this.assignUserToTenants(savedUser.id, tenantIds);
    }

    return this.findOne(savedUser.id, owner);
  }

  async findAll(query: PaginationQueryDto, owner: BoUser) {
    const { page = 1, limit = 10 } = query;
    const ownerTenantIds = this.getAccessibleTenantIds(owner);
    return this.findPaginatedUsersByTenants(ownerTenantIds, page, limit);
  }

  async findOne(id: string, owner: BoUser) {
    const user = await this.userRepository.findOne({
      where: { id, isOwner: false },
      relations: ['tenantMemberships', 'tenantMemberships.tenant'],
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    this.verifyUserBelongsToOwner(user, owner);
    return this.mapUserToResponse(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto, owner: BoUser) {
    const user = await this.getUserEntity(id, owner);
    const { firstName, lastName, tenantIds } = updateUserDto;

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;

    // Validate before transaction
    if (tenantIds?.length) {
      this.validateTenantIds(tenantIds, owner);
    }

    await this.boConnection.transaction(async (manager) => {
      await manager.save(user);

      if (tenantIds !== undefined) {
        await manager.delete(BoUserTenant, { userId: id });
        await this.assignUserToTenants(id, tenantIds, manager);
      }
    });

    return this.findOne(id, owner);
  }

  async findAllForUser(
    query: PaginationQueryDto,
    currentUserId: string,
    tenantId?: string,
  ) {
    const { page = 1, limit = 10 } = query;
    const currentUser = await this.findCurrentUser(currentUserId);

    // If tenantId is provided, filter by that specific tenant
    if (tenantId) {
      // Verify user has access to this tenant
      const accessibleTenantIds = this.getAccessibleTenantIds(currentUser);
      if (!accessibleTenantIds.includes(tenantId)) {
        throw new ForbiddenException('You do not have access to this tenant');
      }
      return this.findPaginatedUsersByTenants([tenantId], page, limit);
    }

    const accessibleTenantIds = this.getAccessibleTenantIds(currentUser);
    return this.findPaginatedUsersByTenants(accessibleTenantIds, page, limit);
  }

  async findOneForUser(id: string, currentUserId: string, tenantId?: string) {
    const currentUser = await this.findCurrentUser(currentUserId);
    const targetUser = await this.findUserWithRelations(id);

    if (!targetUser) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    // If tenantId is provided, verify user belongs to that tenant
    if (tenantId) {
      const accessibleTenantIds = this.getAccessibleTenantIds(currentUser);
      if (!accessibleTenantIds.includes(tenantId)) {
        throw new ForbiddenException('You do not have access to this tenant');
      }

      const targetTenantIds =
        targetUser.tenantMemberships?.map((m) => m.tenant.id) || [];
      if (!targetTenantIds.includes(tenantId)) {
        throw new NotFoundException(
          `User with id ${id} not found in the specified tenant`,
        );
      }
    } else {
      this.verifyUserAccess(targetUser, currentUser);
    }

    return this.mapUserToResponse(targetUser);
  }

  async updateForUser(
    id: string,
    updateUserDto: UpdateUserDto,
    currentUserId: string,
    tenantId?: string,
  ) {
    const currentUser = await this.findCurrentUser(currentUserId);
    const targetUser = await this.findUserWithRelations(id);

    if (!targetUser) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    // If tenantId is provided, verify access through that tenant
    if (tenantId) {
      const accessibleTenantIds = this.getAccessibleTenantIds(currentUser);
      if (!accessibleTenantIds.includes(tenantId)) {
        throw new ForbiddenException('You do not have access to this tenant');
      }

      const targetTenantIds =
        targetUser.tenantMemberships?.map((m) => m.tenant.id) || [];
      if (!targetTenantIds.includes(tenantId)) {
        throw new NotFoundException(
          `User with id ${id} not found in the specified tenant`,
        );
      }
    }

    const isOwnProfile = currentUserId === id;
    const { isOwner } = currentUser;

    if (!isOwnProfile && !isOwner) {
      throw new ForbiddenException('You can only update your own profile');
    }

    if (!isOwnProfile && isOwner && !tenantId) {
      this.verifyUserAccess(targetUser, currentUser);
    }

    const { firstName, lastName, password, currentPassword, tenantIds } =
      updateUserDto;

    if (firstName !== undefined) targetUser.firstName = firstName;
    if (lastName !== undefined) targetUser.lastName = lastName;

    if (password !== undefined) {
      if (!isOwnProfile) {
        throw new ForbiddenException(
          'Only the user can update their own password',
        );
      }

      // Verify current password before allowing password change
      if (!currentPassword) {
        throw new BadRequestException(
          'Current password is required to change password',
        );
      }

      const isCurrentPasswordValid =
        await targetUser.checkPassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new ForbiddenException('Current password is incorrect');
      }

      await targetUser.setPassword(password);
    }

    if (tenantIds !== undefined && !isOwner) {
      throw new ForbiddenException('Only owners can update tenant assignments');
    }

    if (tenantIds?.length) {
      this.validateTenantIds(tenantIds, currentUser);
    }

    await this.boConnection.transaction(async (manager) => {
      await manager.save(targetUser);

      if (tenantIds !== undefined) {
        await manager.delete(BoUserTenant, { userId: id });
        await this.assignUserToTenants(id, tenantIds, manager);
      }
    });

    return this.findOneForUser(id, currentUserId, tenantId);
  }

  async remove(id: string, owner: BoUser): Promise<{ message: string }> {
    await this.findOne(id, owner);
    await this.userRepository.softDelete(id);

    return { message: `User with id ${id} has been deleted` };
  }

  private async getUserEntity(id: string, owner: BoUser): Promise<BoUser> {
    const user = await this.userRepository.findOne({
      where: { id, isOwner: false },
      relations: ['tenantMemberships', 'tenantMemberships.tenant'],
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    this.verifyUserBelongsToOwner(user, owner);
    return user;
  }

  private validateTenantIds(tenantIds: string[], owner: BoUser): void {
    const ownerTenantIds = this.getAccessibleTenantIds(owner);
    const invalidTenant = tenantIds.find(
      (tid) => !ownerTenantIds.includes(tid),
    );
    if (invalidTenant) {
      throw new BadRequestException(
        `Tenant with id ${invalidTenant} does not belong to your tenant group`,
      );
    }
  }

  private verifyUserBelongsToOwner(user: BoUser, owner: BoUser): void {
    const ownerTenantIds = this.getAccessibleTenantIds(owner);
    const userTenantIds = user.tenantMemberships?.map((m) => m.tenant.id) || [];

    if (
      userTenantIds.length > 0 &&
      !userTenantIds.some((id) => ownerTenantIds.includes(id))
    ) {
      throw new NotFoundException(`User with id ${user.id} not found`);
    }
  }

  private verifyUserAccess(targetUser: BoUser, currentUser: BoUser): void {
    const accessibleTenantIds = this.getAccessibleTenantIds(currentUser);
    const targetTenantIds =
      targetUser.tenantMemberships?.map((m) => m.tenant.id) || [];

    if (
      targetTenantIds.length > 0 &&
      !targetTenantIds.some((id) => accessibleTenantIds.includes(id))
    ) {
      throw new NotFoundException(`User with id ${targetUser.id} not found`);
    }
  }

  private async assignUserToTenants(
    userId: string,
    tenantIds: string[],
    manager?: import('typeorm').EntityManager,
  ): Promise<void> {
    if (tenantIds.length === 0) return;

    const userTenants = tenantIds.map((tenantId) => {
      const userTenant = new BoUserTenant();
      userTenant.userId = userId;
      userTenant.tenantId = tenantId;
      return userTenant;
    });

    if (manager) {
      await manager.save(userTenants);
    } else {
      await this.userTenantRepository.save(userTenants);
    }
  }
}
