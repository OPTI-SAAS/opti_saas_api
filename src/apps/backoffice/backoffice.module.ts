import { Module } from '@nestjs/common';

import { TenantsModule } from './features/tenants/tenants.module';

@Module({
  imports: [TenantsModule],
})
export class BackofficeModule {}
