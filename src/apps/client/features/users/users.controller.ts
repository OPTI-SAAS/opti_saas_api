import {
  ClientController,
  CurrentUser,
  JwtAuthGuard,
  PaginationQueryDto,
} from '@lib/shared';
import { AuthenticatedUser } from '@lib/shared/types';
import {
  Body,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import {
  AssignRoleDto,
  CreateUserDto,
  PaginatedUsersResponseDto,
  UpdateUserDto,
  UserResponseDto,
  UserWithRolesResponseDto,
} from './dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ClientController('users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Task 1: POST /users
   * Create a new user without assigning any role or tenant
   */
  @Post()
  @ApiOperation({
    summary: 'Create a new user',
    description:
      'Creates a user in the same tenant group. Does not assign any tenant or role.',
  })
  @ApiCreatedResponse({ type: UserResponseDto })
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto, user.userId);
  }

  /**
   * Task 2: GET /users
   * Get all users in the same tenant group (not filtered by selected tenant)
   */
  @Get()
  @ApiOperation({
    summary: 'Get all users',
    description:
      'Returns all users in the same tenant group with pagination. Not filtered by selected tenant.',
  })
  @ApiOkResponse({ type: PaginatedUsersResponseDto })
  async findAll(
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaginatedUsersResponseDto> {
    return this.usersService.findAll(query, user.userId);
  }

  /**
   * Task 4: GET /users/:id
   * Get a specific user with their tenants and roles
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get a user by ID',
    description:
      'Returns user information with their tenant and role assignments. Not filtered by selected tenant.',
  })
  @ApiOkResponse({ type: UserWithRolesResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserWithRolesResponseDto> {
    return this.usersService.findOne(id, user.userId);
  }

  /**
   * Task 3: PATCH /users/:id
   * Update user information only (firstName, lastName, password)
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update a user',
    description:
      'Updates user information (firstName, lastName, password). Does not modify tenant or role assignments.',
  })
  @ApiOkResponse({ type: UserResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, updateUserDto, user.userId);
  }

  /**
   * Task 5: PUT /users/:user_id/assign_role
   * Assign roles to a user in multiple tenants
   */
  @Put(':user_id/assign_role')
  @ApiOperation({
    summary: 'Assign roles to a user',
    description:
      'Assigns roles to a user in specified tenants. Creates tenant assignment if not exists.',
  })
  @ApiOkResponse({
    description: 'Role assignments processed successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Role assignments processed successfully',
        },
        assignments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tenant_id: { type: 'string', format: 'uuid' },
              role_id: { type: 'string', format: 'uuid' },
              success: { type: 'boolean' },
            },
          },
        },
      },
    },
  })
  async assignRole(
    @Param('user_id', ParseUUIDPipe) userId: string,
    @Body() assignRoleDto: AssignRoleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.assignRoles(userId, assignRoleDto, user.userId);
  }
}
