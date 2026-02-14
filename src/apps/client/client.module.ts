import { TenancyModule, TenantContextMiddleware } from '@lib/shared';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { AuthModule } from './features/auth/auth.module';
import { UsersModule } from './features/users/users.module';
import { WarehousesModule } from './features/warehouses';
import { DatabaseModule } from './modules/database';

@Module({
  imports: [
    TenancyModule,
    DatabaseModule,
    AuthModule,
    UsersModule,
    WarehousesModule,
  ],
})
export class ClientModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply tenant context middleware to all client routes
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}
