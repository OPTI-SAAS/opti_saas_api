import { BoDatabaseModule } from '@lib/shared';
import { Module } from '@nestjs/common';

import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';

@Module({
  controllers: [TenantsController],
  imports: [BoDatabaseModule],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}
