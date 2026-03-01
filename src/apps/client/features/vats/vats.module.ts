import { BoDatabaseModule, SharedJwtModule } from '@lib/shared';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

import { VatsController } from './vats.controller';
import { VatsService } from './vats.service';

@Module({
  imports: [ConfigModule, BoDatabaseModule, PassportModule, SharedJwtModule],
  controllers: [VatsController],
  providers: [VatsService],
  exports: [VatsService],
})
export class VatsModule {}
