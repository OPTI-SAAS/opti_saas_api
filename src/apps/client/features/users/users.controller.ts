import {
  BoUser,
  ClientController,
  CurrentOwner,
  CurrentTenant,
  CurrentUser,
  JwtAuthGuard,
  OwnerGuard,
  PaginationQueryDto,
} from '@lib/shared';
import { AuthenticatedUser } from '@lib/shared/types';
import {
  Body,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import {
  CreateUserDto,
  PaginatedUsersResponseDto,
  UpdateUserDto,
  UserWithTenantsResponseDto,
} from './dto';
import { UsersService } from './users.service';

const TENANT_HEADER_SCHEMA = {
  name: 'x-tenant-id',
  description:
    'Tenant ID to filter results by. Must be a UUID of a tenant the user has access to.',
  required: false,
  schema: { type: 'string', format: 'uuid' },
};

@ApiTags('Users')
@ClientController('users')
@ApiBearerAuth('access-token')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiOperation({ summary: 'Create a new tenant user (Owner only)' })
  @ApiCreatedResponse({ type: UserWithTenantsResponseDto })
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentOwner() owner: BoUser,
  ) {
    return this.usersService.create(createUserDto, owner);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all users with pagination' })
  @ApiHeader(TENANT_HEADER_SCHEMA)
  @ApiOkResponse({ type: PaginatedUsersResponseDto })
  async findAll(
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant(false) tenantId?: string,
  ) {
    return this.usersService.findAllForUser(query, user.userId, tenantId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a specific user by ID' })
  @ApiHeader(TENANT_HEADER_SCHEMA)
  @ApiOkResponse({ type: UserWithTenantsResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant(false) tenantId?: string,
  ) {
    return this.usersService.findOneForUser(id, user.userId, tenantId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a user' })
  @ApiHeader(TENANT_HEADER_SCHEMA)
  @ApiOkResponse({ type: UserWithTenantsResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant(false) tenantId?: string,
  ) {
    return this.usersService.updateForUser(
      id,
      updateUserDto,
      user.userId,
      tenantId,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiOperation({ summary: 'Soft delete a user (Owner only)' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentOwner() owner: BoUser,
  ) {
    return this.usersService.remove(id, owner);
  }
}
