import {
  BoUser,
  ClientController,
  CurrentOwner,
  CurrentUser,
  JwtAuthGuard,
  OwnerGuard,
  PaginationQueryDto,
} from '@lib/shared';
import { AuthenticatedUser } from '@lib/shared/decorators/current-user.decorator';
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
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
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

  /**
   * POST /users - Create a new user (Owner only)
   */
  @Post()
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiOperation({
    summary: 'Create a new tenant user',
    description: `
Creates a new user in the system with optional tenant assignments.

**Access Control:**
- Requires valid JWT Bearer token
- Only accessible by owner users
- Tenant users will receive a 403 Forbidden response

**Notes:**
- Created users are always non-owners (isOwner=false)
- If tenantIds are provided, they must belong to the owner's tenant group
- Email must be unique across the system
    `,
  })
  @ApiCreatedResponse({
    description: 'User successfully created',
    type: UserWithTenantsResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Only owner users can access this resource',
  })
  @ApiConflictResponse({
    description: 'Conflict - User with this email already exists',
  })
  @ApiBadRequestResponse({
    description: 'Bad Request - Invalid tenant ID or validation error',
  })
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentOwner() owner: BoUser,
  ) {
    return this.usersService.create(createUserDto, owner);
  }

  /**
   * GET /users - Get all users (Any authenticated user)
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get all users with pagination',
    description: `
Retrieves a paginated list of users.

**Access Control:**
- Requires valid JWT Bearer token
- Accessible by any authenticated user
- Owners see users from their tenant group
- Regular users see users from their assigned tenants
    `,
  })
  @ApiOkResponse({
    description: 'Successfully retrieved users list',
    type: PaginatedUsersResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async findAll(
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.findAllForUser(query, user.userId);
  }

  /**
   * GET /users/:id - Get a specific user (Any authenticated user)
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get a specific user by ID',
    description: `
Retrieves detailed information about a specific user.

**Access Control:**
- Requires valid JWT Bearer token
- Accessible by any authenticated user
- Users can view other users in their tenants
    `,
  })
  @ApiOkResponse({
    description: 'Successfully retrieved user',
    type: UserWithTenantsResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.findOneForUser(id, user.userId);
  }

  /**
   * PATCH /users/:id - Update a user
   * - Regular users can only update their own profile (firstName, lastName, password)
   * - Owners can update any user in their tenant group (including tenantIds)
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Update a user',
    description: `
Updates user information.

**Access Control:**
- Requires valid JWT Bearer token
- Regular users can only update their own profile (firstName, lastName, password)
- Owners can update any user in their tenant group (including tenantIds)

**Notes:**
- Email cannot be updated
- tenantIds can only be updated by owners
- Password can only be updated by the user themselves
    `,
  })
  @ApiOkResponse({
    description: 'Successfully updated user',
    type: UserWithTenantsResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Cannot update this user',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiBadRequestResponse({
    description: 'Bad Request - Invalid tenant ID or validation error',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.updateForUser(id, updateUserDto, user.userId);
  }

  /**
   * DELETE /users/:id - Soft delete a user (Owner only)
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiOperation({
    summary: 'Soft delete a user',
    description: `
Soft deletes a user from the system. The user record is not physically removed but marked as deleted.

**Access Control:**
- Requires valid JWT Bearer token
- Only accessible by owner users
- User must belong to one of the owner's tenants
    `,
  })
  @ApiOkResponse({
    description: 'Successfully deleted user',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'User with id xxx has been deleted',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Only owner users can access this resource',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentOwner() owner: BoUser,
  ) {
    return this.usersService.remove(id, owner);
  }
}
