import { BoDatabaseModule, SharedJwtModule } from '@lib/shared';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [ConfigModule, BoDatabaseModule, PassportModule, SharedJwtModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
