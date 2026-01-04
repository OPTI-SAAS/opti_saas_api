import { AsyncLocalStorage } from 'node:async_hooks';

import { BadRequestException, Injectable } from '@nestjs/common';

interface TenantContextStore {
  tenantId: string;
}

@Injectable()
export class TenantContext {
  private readonly als = new AsyncLocalStorage<TenantContextStore>();

  /**
   * Run a function within a tenant context
   * @param tenantId The tenant identifier
   * @param fn The function to execute within the context
   */
  run<T>(tenantId: string, function_: () => T): T {
    return this.als.run({ tenantId }, function_);
  }

  /**
   * Get the current tenant ID from the context
   * @throws BadRequestException if no tenant context is available
   */
  getTenantId(): string {
    const store = this.als.getStore();
    if (!store?.tenantId) {
      throw new BadRequestException('Tenant context is not available');
    }
    return store.tenantId;
  }

  /**
   * Check if a tenant context exists
   */
  hasTenantContext(): boolean {
    const store = this.als.getStore();
    return !!store?.tenantId;
  }
}
