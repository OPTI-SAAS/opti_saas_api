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
import { DataSource, In, Repository } from 'typeorm';

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

  private async getUserIdsFromTenants(tenantIds: string[]): Promise<string[]> {
    if (tenantIds.length === 0) return [];

    const userTenants = await this.userTenantRepository.find({
      where: { tenantId: In(tenantIds) },
      select: ['userId'],
    });

    return [...new Set(userTenants.map((ut) => ut.userId))];
  }

  private getAccessibleTenantIds(user: BoUser): string[] {
    if (user.isOwner && user.ownedTenantGroup) {
      return user.ownedTenantGroup.tenants?.map((t) => t.id) || [];
    }
    return user.tenantMemberships?.map((m) => m.tenant.id) || [];
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

    if (ownerTenantIds.length === 0) {
      return this.emptyPaginatedResponse(page, limit);
    }

    const userIds = await this.getUserIdsFromTenants(ownerTenantIds);
    if (userIds.length === 0) {
      return this.emptyPaginatedResponse(page, limit);
    }

    const [data, total] = await this.userRepository.findAndCount({
      where: { id: In(userIds), isOwner: false },
      relations: ['tenantMemberships', 'tenantMemberships.tenant'],
      take: limit,
      skip: (page - 1) * limit,
      order: { createdAt: 'DESC' },
    });

    const meta = this.buildPaginationMeta(page, limit, total);
    if (meta.pages !== 0 && page > meta.pages) {
      throw new NotFoundException(
        `Page ${page} is out of range. There are only ${meta.pages} page(s) available.`,
      );
    }

    return { data: data.map((u) => this.mapUserToResponse(u)), meta };
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

    await this.userRepository.save(user);

    if (tenantIds !== undefined) {
      if (tenantIds.length > 0) {
        this.validateTenantIds(tenantIds, owner);
      }
      await this.userTenantRepository.delete({ userId: id });
      if (tenantIds.length > 0) {
        await this.assignUserToTenants(id, tenantIds);
      }
    }

    return this.findOne(id, owner);
  }

  async findAllForUser(query: PaginationQueryDto, currentUserId: string) {
    const { page = 1, limit = 10 } = query;
    const currentUser = await this.findCurrentUser(currentUserId);
    const accessibleTenantIds = this.getAccessibleTenantIds(currentUser);

    if (accessibleTenantIds.length === 0) {
      return this.emptyPaginatedResponse(page, limit);
    }

    const userIds = await this.getUserIdsFromTenants(accessibleTenantIds);
    if (userIds.length === 0) {
      return this.emptyPaginatedResponse(page, limit);
    }

    const [data, total] = await this.userRepository.findAndCount({
      where: { id: In(userIds), isOwner: false },
      relations: ['tenantMemberships', 'tenantMemberships.tenant'],
      take: limit,
      skip: (page - 1) * limit,
      order: { createdAt: 'DESC' },
    });

    const meta = this.buildPaginationMeta(page, limit, total);
    if (meta.pages !== 0 && page > meta.pages) {
      throw new NotFoundException(
        `Page ${page} is out of range. There are only ${meta.pages} page(s) available.`,
      );
    }

    return { data: data.map((u) => this.mapUserToResponse(u)), meta };
  }

  async findOneForUser(id: string, currentUserId: string) {
    const currentUser = await this.findCurrentUser(currentUserId);
    const targetUser = await this.findUserWithRelations(id);

    if (!targetUser) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    this.verifyUserAccess(targetUser, currentUser);
    return this.mapUserToResponse(targetUser);
  }

  async updateForUser(
    id: string,
    updateUserDto: UpdateUserDto,
    currentUserId: string,
  ) {
    const currentUser = await this.findCurrentUser(currentUserId);
    const targetUser = await this.findUserWithRelations(id);

    if (!targetUser) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    const isOwnProfile = currentUserId === id;
    const { isOwner } = currentUser;

    if (!isOwnProfile && !isOwner) {
      throw new ForbiddenException('You can only update your own profile');
    }

    if (!isOwnProfile && isOwner) {
      this.verifyUserAccess(targetUser, currentUser);
    }

    const { firstName, lastName, password, tenantIds } = updateUserDto;

    if (firstName !== undefined) targetUser.firstName = firstName;
    if (lastName !== undefined) targetUser.lastName = lastName;

    if (password !== undefined) {
      if (!isOwnProfile) {
        throw new ForbiddenException(
          'Only the user can update their own password',
        );
      }
      await targetUser.setPassword(password);
    }

    if (tenantIds !== undefined) {
      if (!isOwner) {
        throw new ForbiddenException(
          'Only owners can update tenant assignments',
        );
      }

      const ownerTenantIds = this.getAccessibleTenantIds(currentUser);
      const invalidTenant = tenantIds.find(
        (tid) => !ownerTenantIds.includes(tid),
      );
      if (invalidTenant) {
        throw new BadRequestException(
          `Tenant with id ${invalidTenant} does not belong to your tenant group`,
        );
      }

      await this.userTenantRepository.delete({ userId: id });
      if (tenantIds.length > 0) {
        await this.assignUserToTenants(id, tenantIds);
      }
    }

    await this.userRepository.save(targetUser);
    return this.findOneForUser(id, currentUserId);
  }

  async remove(id: string, owner: BoUser): Promise<{ message: string }> {
    await this.findOne(id, owner);

    const result = await this.userRepository.softDelete(id);
    if (!result.affected) {
      throw new BadRequestException(
        `User with id ${id} not found or already deleted`,
      );
    }

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
  ): Promise<void> {
    const userTenants = tenantIds.map((tenantId) => {
      const userTenant = new BoUserTenant();
      userTenant.userId = userId;
      userTenant.tenantId = tenantId;
      return userTenant;
    });

    await this.userTenantRepository.save(userTenants);
  }
}
