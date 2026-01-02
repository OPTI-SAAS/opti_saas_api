import { getBoSourceOptions } from '@lib/shared';
import { ExceptionErrorType } from '@lib/shared/types';
import { NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

let bo_connection: DataSource | undefined;

const BO_SCHEMA = 'backoffice';

export async function getBoConnection(): Promise<DataSource> {
  const schema_name = BO_SCHEMA;
  if (bo_connection) {
    const existingConnection = bo_connection;
    if (existingConnection?.isInitialized) {
      return existingConnection;
    }
    try {
      // Reinitialize the connection if it's not initialized
      console.log(`Reinitializing connection for schema: ${schema_name}`);
      await existingConnection?.initialize();
      return existingConnection;
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

  try {
    // Create a new DataSource instance
    const newDataSource = new DataSource({
      ...getBoSourceOptions(),
      migrations: undefined,
      name: schema_name,
      schema: schema_name,
      logging: false,
      poolSize: 1,
    });
    await newDataSource.initialize();
    console.log('+++ schema initialized +++');
    // await newDataSource.query(`CREATE SCHEMA IF NOT EXISTS "${schema_name}"`); // TODO: fixme
    await newDataSource.query(`SET search_path TO "${schema_name}"`);
    const result = await newDataSource.query<{ schema: string }[]>(
      'SELECT current_schema() as schema',
    );
    if (result[0].schema !== BO_SCHEMA) {
      throw new NotFoundException({
        error_code: ExceptionErrorType.TenantNotFound,
        message: `backoffice schema not found`,
      });
    }
    bo_connection = newDataSource;
    return newDataSource;
  } catch (error) {
    console.log('Error creating connection', error);
    console.error(error);
    throw new NotFoundException({
      error_code: ExceptionErrorType.TenantNotFound,
      message: `Tenant ID not found`,
    });
  }
}

export async function getBoEntityManager(): Promise<EntityManager> {
  const dataSource = await getBoConnection();
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  return queryRunner.manager;
}
