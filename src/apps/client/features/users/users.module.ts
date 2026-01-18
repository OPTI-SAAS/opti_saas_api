import { BoDatabaseModule, SharedJwtModule, TenancyModule } from '@lib/shared';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    ConfigModule,
    BoDatabaseModule,
    TenancyModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    SharedJwtModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
