import {
  ClientController,
  CurrentUser,
  JwtAuthGuard,
  TenantApiHeader,
} from '@lib/shared';
import { JwtPayload } from '@lib/shared/types';
import { Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthService } from './auth.service';

@ApiTags('Auth')
@ClientController('auth')
@ApiBearerAuth('access-token')
@TenantApiHeader()
export class AuthClientController {
  constructor(private readonly authService: AuthService) {}

  @Get('options')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get authenticated User options' })
  async getAuthOptions(@CurrentUser() user: JwtPayload) {
    return await this.authService.getUserOptions(user.sub);
  }
}
