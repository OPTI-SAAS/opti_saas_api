import { DataSource, DataSourceOptions } from 'typeorm';

import { getSourceSchema } from './migration.helpers';

if (process.argv.length < 3) {
  console.log('We need the schema name as an argument');
  process.exit(1);
}

const schema_name = process.argv[2];

revertMigration()
  .then(() => {
    console.log(`--- (${schema_name}) migration reverted successfully ---`);
    process.exit(0);
  })
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });

async function revertMigration() {
  const isBackoffice = schema_name === 'backoffice';
  const dataSource = new DataSource({
    ...getSourceSchema(isBackoffice ? 'backoffice' : 'client'),
    schema: schema_name,
  } as DataSourceOptions);

  await checkSchemaExists(schema_name, dataSource);

  try {
    await dataSource.initialize();
    await dataSource.undoLastMigration(); // Reverts the last migration
    await dataSource.destroy();
  } catch (error) {
    console.error('Error reverting migration:', error);
    process.exit(1);
  }
}

async function checkSchemaExists(
  schemaName: string,
  dataSource: DataSource,
): Promise<boolean> {
  try {
    await dataSource.initialize();

    const result: unknown[] = await dataSource.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`,
      [schemaName],
    );
    if (result?.length === 0) {
      console.log(`Schema ${schemaName} does not exist`);
    }
    return result?.length > 0;
  } catch (error) {
    console.error('Error checking schema:', error);
    return false;
  } finally {
    await dataSource.destroy();
  }
}
