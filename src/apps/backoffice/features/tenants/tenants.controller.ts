import { BackofficeController } from '@lib/shared';
import { Body, Injectable, Param, Post } from '@nestjs/common';

import {
  CreateTenantDto,
  CreateTenantWithOwnerDto,
} from './dto/create-tenant-with-owner.dto';
import { TenantsService } from './tenants.service';

@Injectable()
@BackofficeController('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post('create-with-owner')
  createTenantWithOwner(
    @Body() createTenantWithOwnerDto: CreateTenantWithOwnerDto,
  ) {
    return this.tenantsService.createTenantWithOwner(createTenantWithOwnerDto);
  }

  @Post(':userId')
  createTenant(
    @Param('userId') userId: string,
    @Body() createTenantDto: CreateTenantDto,
  ) {
    return this.tenantsService.createTenant(createTenantDto.tenantName, userId);
  }
}
