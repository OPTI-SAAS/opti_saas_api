import {
  BACKOFFICE_CONNECTION,
  BoTenant,
  BoTenantGroup,
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
  private tenantRepository: Repository<BoTenant>;
  private tenantGroupRepository: Repository<BoTenantGroup>;
  private userTenantRepository: Repository<BoUserTenant>;

  constructor(
    @Inject(BACKOFFICE_CONNECTION)
    private readonly boConnection: DataSource,
  ) {
    this.userRepository = this.boConnection.getRepository(BoUser);
    this.tenantRepository = this.boConnection.getRepository(BoTenant);
    this.tenantGroupRepository = this.boConnection.getRepository(BoTenantGroup);
    this.userTenantRepository = this.boConnection.getRepository(BoUserTenant);
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

  private async validateTenantGroup(
    tenantGroupId: string,
  ): Promise<BoTenantGroup> {
    const tenantGroup = await this.tenantGroupRepository.findOne({
      where: { id: tenantGroupId },
    });

    if (!tenantGroup) {
      throw new NotFoundException(
        `Tenant group with id ${tenantGroupId} not found`,
      );
    }

    return tenantGroup;
  }

  private async validateTenantsInGroup(
    tenantIds: string[],
    tenantGroupId: string,
  ): Promise<BoTenant[]> {
    const tenants = await this.tenantRepository.find({
      where: { id: In(tenantIds) },
    });

    if (tenants.length !== tenantIds.length) {
      const foundIds = tenants.map((t) => t.id);
      const missingIds = tenantIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `Tenants not found: ${missingIds.join(', ')}`,
      );
    }

    const invalidTenants = tenants.filter(
      (t) => t.tenantGroupId !== tenantGroupId,
    );
    if (invalidTenants.length > 0) {
      throw new BadRequestException(
        `Tenants ${invalidTenants.map((t) => t.id).join(', ')} do not belong to tenant group ${tenantGroupId}`,
      );
    }

    return tenants;
  }

  async create(createUserDto: CreateUserDto, currentUserId: string) {
    const { firstName, lastName, email, password, tenantIds } = createUserDto;

    // Get current user to inherit tenantGroupId
    const currentUser = await this.userRepository.findOne({
      where: { id: currentUserId },
    });

    if (!currentUser || !currentUser.tenantGroupId) {
      throw new BadRequestException(
        'Current user does not belong to a tenant group',
      );
    }

    const tenantGroupId = currentUser.tenantGroupId;

    // Check if user with email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Validate all tenants exist and belong to the tenant group
    await this.validateTenantsInGroup(tenantIds, tenantGroupId);

    // Use transaction to ensure atomicity
    const savedUser = await this.boConnection.transaction(async (manager) => {
      // Create user
      const user = new BoUser();
      Object.assign(user, { firstName, lastName, email, tenantGroupId });
      await user.setPassword(password);

      const createdUser = await manager.save(BoUser, user);

      // Create user-tenant memberships
      const userTenants = tenantIds.map((tenantId) => {
        const userTenant = new BoUserTenant();
        userTenant.userId = createdUser.id;
        userTenant.tenantId = tenantId;
        return userTenant;
      });

      await manager.save(BoUserTenant, userTenants);

      return createdUser;
    });

    return this.findOne(savedUser.id);
  }

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 10 } = query;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.tenantGroup', 'tenantGroup')
      .leftJoinAndSelect('user.tenantMemberships', 'tenantMemberships')
      .leftJoinAndSelect('tenantMemberships.tenant', 'tenant')
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

    return { data, meta };
  }

  async findOne(id: string): Promise<BoUser> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: [
        'tenantGroup',
        'tenantMemberships',
        'tenantMemberships.tenant',
      ],
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    currentUserId: string,
  ) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: [
        'tenantGroup',
        'tenantMemberships',
        'tenantMemberships.tenant',
      ],
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    const isOwnProfile = currentUserId === id;
    const { firstName, lastName, password, currentPassword, tenantIds } =
      updateUserDto;

    // Validate tenants BEFORE any updates
    if (tenantIds !== undefined && tenantIds.length > 0) {
      await this.validateTenantsInGroup(tenantIds, user.tenantGroupId);
    }

    // Handle password update
    if (password !== undefined) {
      if (!isOwnProfile) {
        throw new ForbiddenException(
          'Only the user can update their own password',
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

    // Update basic user fields
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;

    // Save user (without transaction for simple updates)
    await this.userRepository.save(user);

    // Handle tenant assignments update
    if (tenantIds !== undefined) {
      // Remove existing tenant memberships
      await this.userTenantRepository.delete({ userId: id });

      // Create new tenant memberships
      if (tenantIds.length > 0) {
        const userTenants = tenantIds.map((tenantId) => {
          const userTenant = new BoUserTenant();
          userTenant.userId = id;
          userTenant.tenantId = tenantId;
          return userTenant;
        });

        await this.userTenantRepository.save(userTenants);
      }
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    await this.userRepository.softDelete(id);

    return { message: `User with id ${id} has been deleted` };
  }
}
