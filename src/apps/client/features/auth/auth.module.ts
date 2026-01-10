import { BoDatabaseModule, JwtStrategy, SharedJwtModule } from '@lib/shared';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

import { AuthClientController } from './auth.client.controller';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    ConfigModule,
    BoDatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    SharedJwtModule,
  ],
  controllers: [AuthController, AuthClientController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
