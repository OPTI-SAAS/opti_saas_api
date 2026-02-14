import { BoDatabaseModule, SharedJwtModule } from '@lib/shared';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

import { WarehousesController } from './warehouses.controller';
import { WarehousesService } from './warehouses.service';

@Module({
  imports: [
    ConfigModule,
    BoDatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    SharedJwtModule,
  ],
  controllers: [WarehousesController],
  providers: [WarehousesService],
  exports: [WarehousesService],
})
export class WarehousesModule {}
