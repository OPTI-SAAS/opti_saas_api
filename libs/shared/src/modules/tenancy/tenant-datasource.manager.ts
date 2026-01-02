import { BoTenant, getClientSourceOptions } from '@lib/shared';
import { ExceptionErrorType } from '@lib/shared/types';
import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import { getBoConnection } from '../database/connection.bo';
import { TenantContext } from './tenant.context';

@Injectable()
export class TenantDataSourceManager implements OnModuleInit {
  private dataSource!: DataSource;
  private initPromise!: Promise<DataSource>;

  constructor(private readonly tenantContext: TenantContext) {}

  async onModuleInit() {
    // Initialize single shared DataSource on module startup
    this.initPromise = this.initializeDataSource();
    await this.initPromise;
  }

  /**
   * Initialize the shared DataSource (no schema selected)
   */
  private async initializeDataSource(): Promise<DataSource> {
    if (this.dataSource?.isInitialized) {
      return this.dataSource;
    }

    console.log('Initializing shared client DataSource');
    this.dataSource = new DataSource({
      ...getClientSourceOptions(),
      name: 'client-shared',
      logging: false,
      // No schema specified - will be set per-transaction
    });

    await this.dataSource.initialize();
    console.log('Shared client DataSource initialized');
    return this.dataSource;
  }

  /**
   * Get tenant schema from database
   */
  private async getTenantSchema(tenantId: string): Promise<string> {
    const boConnection = await getBoConnection();
    const tenantRepository = boConnection.getRepository(BoTenant);
    const tenant = await tenantRepository.findOneBy({ id: tenantId });

    if (!tenant) {
      throw new NotFoundException({
        error_code: ExceptionErrorType.TenantNotFound,
        message: `Tenant ID ${tenantId} not found`,
      });
    }

    return this.sanitizeSchema(tenant.dbSchema);
  }

  /**
   * Execute a callback within a tenant context with schema set
   * @param callback Function that receives EntityManager with tenant schema set
   * @param tenantId Optional tenant ID (uses context if not provided)
   */
  async executeInTenantContext<T>(
    callback: (manager: EntityManager) => Promise<T>,
    tenantId?: string,
  ): Promise<T> {
    await this.initPromise;

    const resolvedTenantId = tenantId ?? this.tenantContext.getTenantId();
    const schema = await this.getTenantSchema(resolvedTenantId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // Set search path for this connection
      await queryRunner.query(`SET search_path TO "${schema}", public;`);

      // Verify schema is set correctly
      const schemaResult = (await queryRunner.query(
        'SELECT current_schema() as schema',
      )) as Array<{ schema: string }>;

      if (schemaResult[0].schema !== schema) {
        throw new NotFoundException({
          error_code: ExceptionErrorType.TenantNotFound,
          message: `[DB not initialized] Tenant schema ${schema} not found`,
        });
      }

      // Execute the callback with the manager
      return await callback(queryRunner.manager);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Execute a transactional callback within tenant context
   * @param callback Function that receives EntityManager within a transaction
   * @param tenantId Optional tenant ID (uses context if not provided)
   */
  async executeInTransaction<T>(
    callback: (manager: EntityManager) => Promise<T>,
    tenantId?: string,
  ): Promise<T> {
    await this.initPromise;

    const resolvedTenantId = tenantId ?? this.tenantContext.getTenantId();
    const schema = await this.getTenantSchema(resolvedTenantId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Set search path for this transaction
      await queryRunner.query(`SET search_path TO "${schema}", public;`);

      // Verify schema is set correctly
      const schemaResult = (await queryRunner.query(
        'SELECT current_schema() as schema',
      )) as Array<{ schema: string }>;

      if (schemaResult[0].schema !== schema) {
        throw new NotFoundException({
          error_code: ExceptionErrorType.TenantNotFound,
          message: `[DB not initialized] Tenant schema ${schema} not found`,
        });
      }

      // Execute the callback with the transactional manager
      const callbackResult = await callback(queryRunner.manager);

      await queryRunner.commitTransaction();
      return callbackResult;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Sanitize schema name to prevent SQL injection
   * Only allows lowercase letters, numbers, and underscores
   */
  private sanitizeSchema(schema: string): string {
    return schema.toLowerCase().replaceAll(/[^a-z0-9_]/g, '_');
  }

  /**
   * Close the shared DataSource
   */
  async closeConnection(): Promise<void> {
    if (this.dataSource?.isInitialized) {
      await this.dataSource.destroy();
      console.log('Shared client DataSource closed');
    }
  }
}
