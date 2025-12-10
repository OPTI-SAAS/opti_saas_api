import { getClientSourceOptions, sanitizeDatabaseSchema } from '@lib/shared';
import { ExceptionErrorType } from '@lib/shared/types';
import { NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

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
  schema_name: string,
  migrationsRun = false,
): Promise<DataSource> {
  console.log(
    `Getting connection for schema: ${schema_name} with migrationsRun: ${migrationsRun}`,
  );

  if (connections.has(schema_name)) {
    return getExistingConnection(schema_name);
  }
  console.log(`Creating new connection for schema: ${schema_name}`);
  const safeSchema = sanitizeDatabaseSchema(schema_name);
  try {
    // Create a new DataSource instance
    const newDataSource = new DataSource({
      ...getClientSourceOptions(),
      migrationsRun,
      name: safeSchema,
      schema: safeSchema,
      poolSize: 1,
    });
    await newDataSource.initialize();
    console.log('+++ schema initialized +++');
    await newDataSource.query(`SET search_path TO "${schema_name}"`);
    const result = await newDataSource.query<{ schema: string }[]>(
      'SELECT current_schema() as schema',
    );
    if (result[0].schema !== safeSchema) {
      throw new NotFoundException({
        error_code: ExceptionErrorType.TenantNotFound,
        message: `[DB not initialized] Tenant ID ${safeSchema} :: ${schema_name} not found`,
      });
    }

    // If migrations are running so we don't add the connection to the map, since
    if (!migrationsRun) {
      connections.set(safeSchema, newDataSource);
    }
    return newDataSource;
  } catch (error) {
    console.log('Error creating connection', error);
    console.error(error);
    throw new NotFoundException({
      error_code: ExceptionErrorType.TenantNotFound,
      message: `[Error while initializing DB] Tenant ID ${safeSchema} :: ${schema_name} not found`,
    });
  }
}

export async function getTenantEntityManager(
  schema: string,
): Promise<EntityManager> {
  const safeSchema = sanitizeDatabaseSchema(schema);
  const dataSource = await getTenantConnection(safeSchema);
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  return queryRunner.manager;
}
