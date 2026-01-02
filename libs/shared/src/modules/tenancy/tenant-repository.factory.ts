import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { TenantDataSourceManager } from './tenant-datasource.manager';

@Injectable()
export class TenantRepositoryFactory {
  constructor(private readonly dataSourceManager: TenantDataSourceManager) {}

  /**
   * Execute a callback within a transaction in tenant context
   * Schema is automatically set based on tenant context
   * Use manager.getRepository(Entity) inside the callback to access repositories
   * @param callback Function that receives EntityManager within transaction
   */
  async executeInTransaction<T>(
    callback: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    return this.dataSourceManager.executeInTransaction(callback);
  }
}
