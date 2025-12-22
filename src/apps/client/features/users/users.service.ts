import {
  BACKOFFICE_CONNECTION,
  BoTenant,
  BoUser,
  BoUserTenant,
  PaginationQueryDto,
} from '@lib/shared';
import { TPaginatedData } from '@lib/shared/types';
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

/**
 * User response type without sensitive fields
 */
export interface UserResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isOwner: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  tenants: {
    id: string;
    name: string;
    dbSchema: string;
  }[];
}

@Injectable()
export class UsersService {
  private userRepository: Repository<BoUser>;
  private userTenantRepository: Repository<BoUserTenant>;
  private tenantRepository: Repository<BoTenant>;

  constructor(
    @Inject(BACKOFFICE_CONNECTION)
    private readonly boConnection: DataSource,
  ) {
    this.userRepository = this.boConnection.getRepository(BoUser);
    this.userTenantRepository = this.boConnection.getRepository(BoUserTenant);
    this.tenantRepository = this.boConnection.getRepository(BoTenant);
  }

  /**
   * Map BoUser entity to safe response (excludes password, refreshToken)
   */
  private mapUserToResponse(user: BoUser): UserResponse {
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
        user.tenantMemberships?.map((membership) => ({
          id: membership.tenant.id,
          name: membership.tenant.name,
          dbSchema: membership.tenant.dbSchema,
        })) || [],
    };
  }

  /**
   * Create a new tenant user (non-owner) and optionally assign to tenants.
   */
  async create(
    createUserDto: CreateUserDto,
    owner: BoUser,
  ): Promise<UserResponse> {
    const { firstName, lastName, email, password, tenantIds } = createUserDto;

    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Validate tenantIds belong to owner's tenant group
    if (tenantIds && tenantIds.length > 0) {
      this.validateTenantIds(tenantIds, owner);
    }

    // Create user
    const user = new BoUser();
    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;
    user.isOwner = false;
    await user.setPassword(password);

    const savedUser = await this.userRepository.save(user);

    // Assign user to tenants
    if (tenantIds && tenantIds.length > 0) {
      await this.assignUserToTenants(savedUser.id, tenantIds);
    }

    // Return user with tenants
    return this.findOne(savedUser.id, owner);
  }

  /**
   * Get all tenant users with pagination (only users in owner's tenants).
   */
  async findAll(
    query: PaginationQueryDto,
    owner: BoUser,
  ): Promise<TPaginatedData<UserResponse>> {
    const { page = 1, limit = 10 } = query;

    // Get all tenant IDs from owner's tenant group
    const ownerTenantIds =
      owner.ownedTenantGroup?.tenants?.map((t) => t.id) || [];

    if (ownerTenantIds.length === 0) {
      return {
        data: [],
        meta: {
          page,
          limit,
          total: 0,
          pages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    }

    // Get user IDs that belong to owner's tenants
    const userTenants = await this.userTenantRepository.find({
      where: { tenantId: In(ownerTenantIds) },
      select: ['userId'],
    });

    const userIds = [...new Set(userTenants.map((ut) => ut.userId))];

    if (userIds.length === 0) {
      return {
        data: [],
        meta: {
          page,
          limit,
          total: 0,
          pages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    }

    const [data, total] = await this.userRepository.findAndCount({
      where: { id: In(userIds), isOwner: false },
      relations: ['tenantMemberships', 'tenantMemberships.tenant'],
      take: limit,
      skip: (page - 1) * limit,
      order: { createdAt: 'DESC' },
    });

    const totalPages = Math.ceil(total / limit);
    if (totalPages !== 0 && page > totalPages) {
      throw new NotFoundException({
        message: `Page ${page} is out of range. There are only ${totalPages} page(s) available.`,
      });
    }

    return {
      data: data.map((user) => this.mapUserToResponse(user)),
      meta: {
        page,
        limit,
        total,
        pages: totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
      },
    };
  }

  /**
   * Get a single user by ID.
   */
  async findOne(id: string, owner: BoUser): Promise<UserResponse> {
    const user = await this.userRepository.findOne({
      where: { id, isOwner: false },
      relations: ['tenantMemberships', 'tenantMemberships.tenant'],
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    // Verify user belongs to owner's tenants
    this.verifyUserBelongsToOwner(user, owner);

    return this.mapUserToResponse(user);
  }

  /**
   * Update a user.
   */
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    owner: BoUser,
  ): Promise<UserResponse> {
    // First get the raw user entity
    const user = await this.getUserEntity(id, owner);

    const { firstName, lastName, tenantIds } = updateUserDto;

    // Update basic fields
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;

    await this.userRepository.save(user);

    // Update tenant assignments if provided
    if (tenantIds !== undefined) {
      // Validate tenantIds belong to owner's tenant group
      if (tenantIds.length > 0) {
        this.validateTenantIds(tenantIds, owner);
      }

      // Remove existing tenant memberships
      await this.userTenantRepository.delete({ userId: id });

      // Assign new tenants
      if (tenantIds.length > 0) {
        await this.assignUserToTenants(id, tenantIds);
      }
    }

    return this.findOne(id, owner);
  }

  /**
   * Get all users accessible by a regular user (users in same tenants).
   */
  async findAllForUser(
    query: PaginationQueryDto,
    currentUserId: string,
  ): Promise<TPaginatedData<UserResponse>> {
    const { page = 1, limit = 10 } = query;

    // Get the current user with their tenants
    const currentUser = await this.userRepository.findOne({
      where: { id: currentUserId },
      relations: [
        'tenantMemberships',
        'tenantMemberships.tenant',
        'ownedTenantGroup',
        'ownedTenantGroup.tenants',
      ],
    });

    if (!currentUser) {
      throw new NotFoundException('Current user not found');
    }

    // Get tenant IDs the user has access to
    let accessibleTenantIds: string[];

    if (currentUser.isOwner && currentUser.ownedTenantGroup) {
      // Owner: can see users from all tenants in their group
      accessibleTenantIds =
        currentUser.ownedTenantGroup.tenants?.map((t) => t.id) || [];
    } else {
      // Regular user: can see users from their assigned tenants
      accessibleTenantIds =
        currentUser.tenantMemberships?.map((m) => m.tenant.id) || [];
    }

    if (accessibleTenantIds.length === 0) {
      return {
        data: [],
        meta: {
          page,
          limit,
          total: 0,
          pages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    }

    // Get user IDs that belong to accessible tenants
    const userTenants = await this.userTenantRepository.find({
      where: { tenantId: In(accessibleTenantIds) },
      select: ['userId'],
    });

    const userIds = [...new Set(userTenants.map((ut) => ut.userId))];

    if (userIds.length === 0) {
      return {
        data: [],
        meta: {
          page,
          limit,
          total: 0,
          pages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    }

    const [data, total] = await this.userRepository.findAndCount({
      where: { id: In(userIds), isOwner: false },
      relations: ['tenantMemberships', 'tenantMemberships.tenant'],
      take: limit,
      skip: (page - 1) * limit,
      order: { createdAt: 'DESC' },
    });

    const totalPages = Math.ceil(total / limit);
    if (totalPages !== 0 && page > totalPages) {
      throw new NotFoundException({
        message: `Page ${page} is out of range. There are only ${totalPages} page(s) available.`,
      });
    }

    return {
      data: data.map((user) => this.mapUserToResponse(user)),
      meta: {
        page,
        limit,
        total,
        pages: totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
      },
    };
  }

  /**
   * Get a specific user by ID (for any authenticated user).
   */
  async findOneForUser(
    id: string,
    currentUserId: string,
  ): Promise<UserResponse> {
    // Get the current user with their tenants
    const currentUser = await this.userRepository.findOne({
      where: { id: currentUserId },
      relations: [
        'tenantMemberships',
        'tenantMemberships.tenant',
        'ownedTenantGroup',
        'ownedTenantGroup.tenants',
      ],
    });

    if (!currentUser) {
      throw new NotFoundException('Current user not found');
    }

    // Get the target user
    const targetUser = await this.userRepository.findOne({
      where: { id },
      relations: ['tenantMemberships', 'tenantMemberships.tenant'],
    });

    if (!targetUser) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    // Check access
    this.verifyUserAccess(targetUser, currentUser);

    return this.mapUserToResponse(targetUser);
  }

  /**
   * Update a user (for any authenticated user with proper permissions).
   */
  async updateForUser(
    id: string,
    updateUserDto: UpdateUserDto,
    currentUserId: string,
  ): Promise<UserResponse> {
    // Get the current user with their tenants
    const currentUser = await this.userRepository.findOne({
      where: { id: currentUserId },
      relations: [
        'tenantMemberships',
        'tenantMemberships.tenant',
        'ownedTenantGroup',
        'ownedTenantGroup.tenants',
      ],
    });

    if (!currentUser) {
      throw new NotFoundException('Current user not found');
    }

    // Get the target user
    const targetUser = await this.userRepository.findOne({
      where: { id },
      relations: ['tenantMemberships', 'tenantMemberships.tenant'],
    });

    if (!targetUser) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    const isOwnProfile = currentUserId === id;
    const isOwner = currentUser.isOwner;

    // Check permissions
    if (!isOwnProfile && !isOwner) {
      throw new ForbiddenException('You can only update your own profile');
    }

    // If owner updating another user, verify they have access
    if (!isOwnProfile && isOwner) {
      this.verifyUserAccess(targetUser, currentUser);
    }

    const { firstName, lastName, password, tenantIds } = updateUserDto;

    // Update basic fields
    if (firstName !== undefined) targetUser.firstName = firstName;
    if (lastName !== undefined) targetUser.lastName = lastName;

    // Password can only be updated by the user themselves
    if (password !== undefined) {
      if (!isOwnProfile) {
        throw new ForbiddenException(
          'Only the user can update their own password',
        );
      }
      await targetUser.setPassword(password);
    }

    // tenantIds can only be updated by owners
    if (tenantIds !== undefined) {
      if (!isOwner) {
        throw new ForbiddenException(
          'Only owners can update tenant assignments',
        );
      }

      // Validate tenantIds belong to owner's tenant group
      if (tenantIds.length > 0) {
        const ownerTenantIds =
          currentUser.ownedTenantGroup?.tenants?.map((t) => t.id) || [];
        for (const tenantId of tenantIds) {
          if (!ownerTenantIds.includes(tenantId)) {
            throw new BadRequestException(
              `Tenant with id ${tenantId} does not belong to your tenant group`,
            );
          }
        }
      }

      // Remove existing tenant memberships
      await this.userTenantRepository.delete({ userId: id });

      // Assign new tenants
      if (tenantIds.length > 0) {
        await this.assignUserToTenants(id, tenantIds);
      }
    }

    await this.userRepository.save(targetUser);

    return this.findOneForUser(id, currentUserId);
  }

  /**
   * Soft delete a user.
   */
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

  /**
   * Get raw user entity (internal use only)
   */
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

  /**
   * Validate that all tenantIds belong to owner's tenant group.
   */
  private validateTenantIds(tenantIds: string[], owner: BoUser): void {
    const ownerTenantIds =
      owner.ownedTenantGroup?.tenants?.map((t) => t.id) || [];

    for (const tenantId of tenantIds) {
      if (!ownerTenantIds.includes(tenantId)) {
        throw new BadRequestException(
          `Tenant with id ${tenantId} does not belong to your tenant group`,
        );
      }
    }
  }

  /**
   * Verify that user belongs to at least one of owner's tenants.
   */
  private verifyUserBelongsToOwner(user: BoUser, owner: BoUser): void {
    const ownerTenantIds =
      owner.ownedTenantGroup?.tenants?.map((t) => t.id) || [];
    const userTenantIds = user.tenantMemberships?.map((m) => m.tenant.id) || [];

    const belongsToOwner = userTenantIds.some((id) =>
      ownerTenantIds.includes(id),
    );

    if (!belongsToOwner && userTenantIds.length > 0) {
      throw new NotFoundException(`User with id ${user.id} not found`);
    }
  }

  /**
   * Verify that current user has access to view/edit target user.
   */
  private verifyUserAccess(targetUser: BoUser, currentUser: BoUser): void {
    // Get tenant IDs the current user has access to
    let accessibleTenantIds: string[];

    if (currentUser.isOwner && currentUser.ownedTenantGroup) {
      accessibleTenantIds =
        currentUser.ownedTenantGroup.tenants?.map((t) => t.id) || [];
    } else {
      accessibleTenantIds =
        currentUser.tenantMemberships?.map((m) => m.tenant.id) || [];
    }

    const targetTenantIds =
      targetUser.tenantMemberships?.map((m) => m.tenant.id) || [];

    const hasAccess = targetTenantIds.some((id) =>
      accessibleTenantIds.includes(id),
    );

    if (!hasAccess && targetTenantIds.length > 0) {
      throw new NotFoundException(`User with id ${targetUser.id} not found`);
    }
  }

  /**
   * Assign a user to multiple tenants.
   */
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
