import { Global, Module } from '@nestjs/common';

import { TenantContext } from './tenant.context';
import { TenantContextMiddleware } from './tenant-context.middleware';
import { TenantDataSourceManager } from './tenant-datasource.manager';
import { TenantRepositoryFactory } from './tenant-repository.factory';

/**
 * TenancyModule provides AsyncLocalStorage-based tenant context management
 *
 * Features:
 * - TenantContext: Manages tenant context using AsyncLocalStorage
 * - TenantContextMiddleware: Extracts tenantId from headers and sets context
 * - TenantDataSourceManager: Manages per-tenant DataSource connections
 * - TenantRepositoryFactory: Provides repositories for the current tenant
 *
 * Usage:
 * 1. Import TenancyModule in your feature module
 * 2. Apply TenantContextMiddleware to routes that need tenant context
 * 3. Inject TenantRepositoryFactory in services to access tenant repositories
 */
@Global()
@Module({
  providers: [
    TenantContext,
    TenantContextMiddleware,
    TenantDataSourceManager,
    TenantRepositoryFactory,
  ],
  exports: [
    TenantContext,
    TenantContextMiddleware,
    TenantDataSourceManager,
    TenantRepositoryFactory,
  ],
})
export class TenancyModule {}
