import { BACKOFFICE_CONNECTION, BoUser, PaginationQueryDto } from '@lib/shared';
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

  constructor(
    @Inject(BACKOFFICE_CONNECTION)
    private readonly boConnection: DataSource,
  ) {
    this.userRepository = this.boConnection.getRepository(BoUser);
  }

  private mapUserToResponse(user: BoUser) {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      tenantGroupId: user.tenantGroupId || null,
      tenantGroup: user.tenantGroup
        ? {
            id: user.tenantGroup.id,
            ownerId: user.tenantGroup.ownerId,
          }
        : null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt || null,
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

  async create(createUserDto: CreateUserDto) {
    const { firstName, lastName, email, password, tenantGroupId } =
      createUserDto;

    // Check if user with email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = new BoUser();
    Object.assign(user, { firstName, lastName, email, tenantGroupId });
    await user.setPassword(password);

    const savedUser = await this.userRepository.save(user);

    return this.findOne(savedUser.id);
  }

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 10 } = query;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.tenantGroup', 'tenantGroup')
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

  async findOne(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['tenantGroup'],
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return this.mapUserToResponse(user);
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    currentUserId: string,
  ) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['tenantGroup'],
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    const isOwnProfile = currentUserId === id;
    const { firstName, lastName, password, currentPassword } = updateUserDto;

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;

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

    await this.userRepository.save(user);

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
