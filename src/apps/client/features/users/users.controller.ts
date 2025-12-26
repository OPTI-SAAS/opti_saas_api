import {
  ClientController,
  CurrentUser,
  JwtAuthGuard,
  PaginationQueryDto,
  TENANT_HEADER,
  TenantApiHeader,
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
  name: TENANT_HEADER,
  description:
    'Tenant ID to filter results by. Must be a UUID of a tenant the user has access to.',
  required: false,
  schema: { type: 'string', format: 'uuid' },
};

@ApiTags('Users')
@ClientController('users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user in the tenant' })
  @ApiCreatedResponse({ type: UserWithTenantsResponseDto })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users with pagination' })
  @TenantApiHeader()
  @ApiOkResponse({ type: PaginatedUsersResponseDto })
  async findAll(@Query() query: PaginationQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific user by ID' })
  @TenantApiHeader()
  @ApiOkResponse({ type: UserWithTenantsResponseDto })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  @TenantApiHeader()
  @ApiOkResponse({ type: UserWithTenantsResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.update(id, updateUserDto, user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a user' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }
}
