import {
  BoUser,
  ClientController,
  CurrentOwner,
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
  @ApiOkResponse({ type: PaginatedUsersResponseDto })
  async findAll(
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.findAllForUser(query, user.userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a specific user by ID' })
  @ApiOkResponse({ type: UserWithTenantsResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.findOneForUser(id, user.userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a user' })
  @ApiOkResponse({ type: UserWithTenantsResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.updateForUser(id, updateUserDto, user.userId);
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
