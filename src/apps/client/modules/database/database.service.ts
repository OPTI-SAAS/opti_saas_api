import {
  BACKOFFICE_CONNECTION,
  BoTenant,
  getClientSourceOptions,
} from '@lib/shared';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(
    @Inject(BACKOFFICE_CONNECTION) private readonly boDataSource: DataSource,
  ) {}

  async onModuleInit() {
    this.logger.log('Starting tenant migrations on app startup...');
    await this.runMigrationsForAllTenants();
    this.logger.log('Tenant migrations completed successfully');
  }

  /**
   * Get all tenants from backoffice database
   */
  private async getAllTenants(): Promise<BoTenant[]> {
    try {
      const tenantRepository = this.boDataSource.getRepository(BoTenant);
      const tenants = await tenantRepository.find();
      this.logger.log(`Found ${tenants.length} tenants`);
      return tenants;
    } catch (error) {
      this.logger.error('Error fetching tenants from backoffice DB', error);
      throw error;
    }
  }

  /**
   * Run migrations for all tenants
   */
  async runMigrationsForAllTenants(): Promise<void> {
    const tenants = await this.getAllTenants();
    const successfulMigrations: string[] = [];
    const failedMigrations: string[] = [];

    for (const tenant of tenants) {
      try {
        this.logger.log(
          `Running migrations for tenant: ${tenant.name} (schema: ${tenant.dbSchema})`,
        );
        await this.runMigrationForTenant(tenant.dbSchema);
        successfulMigrations.push(tenant.name);
        this.logger.log(`✓ Migrations completed for tenant: ${tenant.name}`);
      } catch (error) {
        this.logger.error(
          `✗ Migration failed for tenant: ${tenant.name}`,
          error,
        );
        failedMigrations.push(tenant.name);
      }
    }

    // Log summary
    this.logger.log('='.repeat(60));
    this.logger.log('Migration Summary:');
    this.logger.log(`  Successful: ${successfulMigrations.length} tenants`);
    if (successfulMigrations.length > 0) {
      this.logger.log(`    - ${successfulMigrations.join(', ')}`);
    }
    this.logger.log(`  Failed: ${failedMigrations.length} tenants`);
    if (failedMigrations.length > 0) {
      this.logger.error(`    - ${failedMigrations.join(', ')}`);
    }
    this.logger.log('='.repeat(60));

    if (failedMigrations.length > 0) {
      throw new Error(
        `Migrations failed for ${failedMigrations.length} tenant(s): ${failedMigrations.join(', ')}`,
      );
    }
  }

  /**
   * Run migrations for a specific tenant schema
   */
  private async runMigrationForTenant(schema: string): Promise<void> {
    let tenantDataSource: DataSource | undefined;

    try {
      // Create a DataSource for the tenant schema
      tenantDataSource = new DataSource({
        ...getClientSourceOptions(),
        name: `migration-${schema}`,
        schema: schema,
        logging: false,
      });

      await tenantDataSource.initialize();
      this.logger.debug(`  - DataSource initialized for schema: ${schema}`);

      // Run pending migrations
      const migrations = await tenantDataSource.runMigrations({
        transaction: 'all',
      });

      if (migrations.length > 0) {
        this.logger.debug(
          `  - Executed ${migrations.length} migration(s) for schema: ${schema}`,
        );
        migrations.forEach((migration) => {
          this.logger.debug(`    • ${migration.name}`);
        });
      } else {
        this.logger.debug(`  - No pending migrations for schema: ${schema}`);
      }
    } catch (error) {
      this.logger.error(
        `Error running migrations for schema: ${schema}`,
        error,
      );
      throw error;
    } finally {
      // Always destroy the connection
      if (tenantDataSource?.isInitialized) {
        await tenantDataSource.destroy();
        this.logger.debug(`  - DataSource destroyed for schema: ${schema}`);
      }
    }
  }
}
