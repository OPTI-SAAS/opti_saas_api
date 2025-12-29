import {
  ClientController,
  CurrentUser,
  JwtAuthGuard,
  PaginationQueryDto,
} from '@lib/shared';
import { AuthenticatedUser } from '@lib/shared/types';
import {
  Body,
  ClassSerializerInterceptor,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
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
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user in the tenant' })
  @ApiCreatedResponse({ type: UserWithTenantsResponseDto })
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.usersService.create(createUserDto, currentUser.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users with pagination' })
  @ApiOkResponse({ type: PaginatedUsersResponseDto })
  async findAll(@Query() query: PaginationQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific user by ID' })
  @ApiOkResponse({ type: UserWithTenantsResponseDto })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
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
