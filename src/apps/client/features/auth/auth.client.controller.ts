import {
  ClientController,
  CurrentUser,
  JwtAuthGuard,
  TenantApiHeader,
} from '@lib/shared';
import { AuthenticatedUser } from '@lib/shared/types';
import { Get, Injectable, Scope, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthClientService } from './auth.client.service';

@ApiTags('Auth')
@ClientController('auth')
@ApiBearerAuth('access-token')
@TenantApiHeader()
@Injectable({ scope: Scope.REQUEST })
export class AuthClientController {
  constructor(private readonly authClientService: AuthClientService) {}

  @Get('options')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get authenticated User options' })
  async getAuthOptions(@CurrentUser() user: AuthenticatedUser) {
    console.log('user: ', user);
    return await this.authClientService.getUserOptions(user.userId);
  }
}
