import { BoDatabaseModule, SharedJwtModule } from '@lib/shared';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

import { StockController } from './stock.controller';
import { StockService } from './stock.service';

@Module({
  imports: [ConfigModule, BoDatabaseModule, PassportModule, SharedJwtModule],
  controllers: [StockController],
  providers: [StockService],
  exports: [StockService],
})
export class StockModule {}
