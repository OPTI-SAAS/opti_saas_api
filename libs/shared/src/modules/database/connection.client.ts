import { BoTenant, getClientSourceOptions } from '@lib/shared';
import { ExceptionErrorType } from '@lib/shared/types';
import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { getBoConnection } from './connection.bo';

const connections = new Map<string, DataSource>();

async function getExistingConnection(schema_name: string) {
  console.log(`Connection for schema: ${schema_name} already exists`);
  const existingConnection = connections.get(schema_name);
  if (existingConnection?.isInitialized) {
    console.log(`Connection for schema: ${schema_name} is initialized`);
    return existingConnection;
  }
  try {
    // Reinitialize the connection if it's not initialized
    console.log(`Reinitializing connection for schema: ${schema_name}`);
    await existingConnection?.initialize();
    return existingConnection!;
  } catch (error) {
    console.error(
      `Error reinitializing connection for schema: ${schema_name}`,
      error,
    );
    throw new NotFoundException({
      error_code: ExceptionErrorType.TenantNotFound,
      message: `Tenant ID not found or failed to initialize`,
    });
  }
}

export async function getTenantConnection(
  tenantId: string,
  migrationsRun = false,
): Promise<DataSource> {
  console.log(`Getting connection for tenantId: ${tenantId} `);

  if (connections.has(tenantId)) {
    return getExistingConnection(tenantId);
  }
  const boConnexion = await getBoConnection();
  const tenantRepository = boConnexion.getRepository(BoTenant);
  const tenant = await tenantRepository.findOneBy({ id: tenantId });
  if (!tenant) {
    throw new NotFoundException({
      error_code: ExceptionErrorType.TenantNotFound,
      message: `Tenant ID ${tenantId} not found`,
    });
  }
  const safeSchema = tenant.dbSchema;
  console.log(`Creating new connection for tenantId: ${tenantId}`);
  try {
    // Create a new DataSource instance
    const newDataSource = new DataSource({
      ...getClientSourceOptions(),
      name: safeSchema,
      schema: safeSchema,
      poolSize: 1,
    });
    await newDataSource.initialize();
    console.log('+++ schema initialized +++');
    await newDataSource.query(`SET search_path TO "${safeSchema}" , public;`);
    const result = await newDataSource.query<{ schema: string }[]>(
      'SELECT current_schema() as schema',
    );
    if (result[0].schema !== safeSchema) {
      throw new NotFoundException({
        error_code: ExceptionErrorType.TenantNotFound,
        message: `[DB not initialized] Tenant ID ${safeSchema} not found`,
      });
    }

    // If migrations are running so we don't add the connection to the map, since
    if (migrationsRun) {
      await newDataSource.runMigrations({
        transaction: 'all',
      });
    } else {
      connections.set(tenantId, newDataSource);
    }
    return newDataSource;
  } catch (error) {
    console.log('Error creating connection', error);
    console.error(error);
    throw new NotFoundException({
      error_code: ExceptionErrorType.TenantMigrationFailed,
      message: `[Error while migrating] Tenant ID ${safeSchema}`,
    });
  }
}
