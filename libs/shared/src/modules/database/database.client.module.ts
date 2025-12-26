import { TENANT_HEADER } from '@lib/shared/constants';
import { Module, Scope, UnauthorizedException } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { isUUID } from 'class-validator';
import { Request } from 'express';

import { getTenantConnection } from './connection.client';
import { CLIENT_CONNECTION } from './database.constant';

const clientConnectionFactory = {
  scope: Scope.REQUEST,
  provide: CLIENT_CONNECTION,
  useFactory: async (request: Request) => {
    try {
      const tenantId = request.headers[TENANT_HEADER] as string | undefined;
      if (!tenantId) {
        throw new UnauthorizedException('Tenant ID is missing');
      }
      if (!isUUID(tenantId)) {
        throw new UnauthorizedException('Invalid Tenant ID format');
      }
      const tenantConnection = await getTenantConnection(tenantId);
      return tenantConnection;
    } catch (error) {
      console.log('Error while getting tenant connection:', error);
    }
    throw new UnauthorizedException();
  },
  inject: [REQUEST, ConfigService],
};

@Module({
  imports: [ConfigModule],
  providers: [clientConnectionFactory],
  exports: [CLIENT_CONNECTION],
})
export class ClientDatabaseModule {}
