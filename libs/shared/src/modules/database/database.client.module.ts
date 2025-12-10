import { Module, Scope, UnauthorizedException } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

// import { JWTAuthModule, JWTAuthService } from '../jwt-auth';
// import { getTenantConnection } from './connection.client';
import { CLIENT_CONNECTION } from './database.constant';

const clientConnectionFactory = {
  scope: Scope.REQUEST,
  provide: CLIENT_CONNECTION,
  useFactory: (
    request: Request,
    /* jwtAuthService: JWTAuthService, */
    /* config: ConfigService, */
  ) => {
    try {
      const authorization = request.headers.authorization;
      if (authorization) {
        // const token = authorization.split(' ')?.[1];
        // const secret = config.getOrThrow<string>('jwt.client.secret');
        // const payload = jwtAuthService.verifyToken({ token, secret: secret });
        // return await getTenantConnection(payload.tenantId);
      }
    } catch (error) {
      console.log('Error while getting tenant connection:', error);
    }
    throw new UnauthorizedException();
  },
  inject: [REQUEST, /* JWTAuthService, */ ConfigService],
};

@Module({
  imports: [ConfigModule /* JWTAuthModule */],
  providers: [clientConnectionFactory],
  exports: [CLIENT_CONNECTION],
})
export class ClientDatabaseModule {}
