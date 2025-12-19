import {
  ClientController,
  CurrentUser,
  JwtAuthGuard,
  MeResponseDataDto,
  TenantUserGuard,
} from '@lib/shared';
import { Body, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@ApiTags('Auth')
@ClientController('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return await this.authService.refresh(refreshTokenDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, TenantUserGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get current authenticated user with tenants',
    description: `
Retrieves the profile information of the currently authenticated user along with all tenants they belong to.

**Access Control:**
- Requires valid JWT Bearer token
- Only accessible by tenant users (non-owners)
- Owner users will receive a 403 Forbidden response

**Response includes:**
- User profile information (id, email, firstName, lastName)
- User metadata (isOwner, createdAt, updatedAt)
- List of tenants the user is a member of
    `,
  })
  @ApiOkResponse({
    description: 'Successfully retrieved user profile with tenants',
    type: MeResponseDataDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
        timestamp: { type: 'string', example: '2025-12-19T00:30:24.830Z' },
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Owner users cannot access this resource',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 403 },
        message: {
          type: 'string',
          example: 'Owner users cannot access this resource',
        },
        timestamp: { type: 'string', example: '2025-12-19T00:30:33.575Z' },
      },
    },
  })
  async getMe(@CurrentUser() user: { userId: string; email: string }) {
    return this.authService.getMe(user.userId);
  }
}
