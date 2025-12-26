import * as fs from 'node:fs';
import * as path from 'node:path';

import * as prettier from 'prettier';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Query } from 'typeorm/driver/Query';
import { camelCase } from 'typeorm/util/StringUtils';

import { checkSchemaArgument, getSourceSchema } from './migration.helpers';
import { SchemaType } from './migration.types';

console.log('process.argv: ', process.argv);

if (process.argv.length < 3) {
  console.log('we need one argument (backoffice|client)');
  process.exit(1);
}

const migration_timestamp = Date.now();

const schema_type = checkSchemaArgument(process.argv[2]);

const dataSource = new DataSource({
  ...getSourceSchema(schema_type),
  schema: schema_type,
} as DataSourceOptions);

generateMigrations()
  .then(async ({ upSqls, downSqls }) => {
    if (upSqls.length < 1 && downSqls.length < 1) {
      console.log('No changes detected');
      process.exit(0);
    }
    console.log('upSqls: ', upSqls);
    console.log('downSqls: ', downSqls);

    console.log('Migration generated successfully');
    const fileContent = await getTemplate(
      'migration',
      migration_timestamp,
      upSqls,
      downSqls.reverse(),
      schema_type,
    );
    // Ensure migration directory exists
    const migrationDirectory = path.join(
      __dirname,
      `../../libs/shared/src/migrations/${schema_type}`,
    );
    if (!fs.existsSync(migrationDirectory)) {
      fs.mkdirSync(migrationDirectory, { recursive: true });
    }

    const filePath = path.join(
      migrationDirectory,
      `${migration_timestamp}-migration.ts`,
    );
    fs.writeFileSync(filePath, fileContent);
    process.exit(0);
  })
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });

function queryParameters(parameters: any[] | undefined): string {
  if (!parameters || !parameters.length) {
    return '';
  }
  return `, ${JSON.stringify(parameters)}`;
}

async function generateMigrations() {
  await dataSource.initialize();
  const logs = await dataSource.driver.createSchemaBuilder().log();
  const upSqls: string[] = [];
  const downSqls: string[] = [];

  for (const upQuery of logs.upQueries) {
    upSqls.push(setSchemaInQuery(upQuery, schema_type));
  }
  for (const downQuery of logs.downQueries) {
    downSqls.push(setSchemaInQuery(downQuery, schema_type));
  }

  return { upSqls, downSqls };
}

const setSchemaInQuery = (query: Query, schema: SchemaType) => {
  if (schema === 'client') {
    return `await queryRunner.query(\`${query.query.replace(/`/g, '\\`').replace(new RegExp(schema_type, 'g'), '${schema}')}\`${queryParameters(query.parameters)});`;
  }
  return `await queryRunner.query(\`${query.query}\`${queryParameters(query.parameters)});`;
};

function getTemplate(
  name: string,
  timestamp: number,
  upSqls: string[],
  downSqls: string[],
  schema_type: SchemaType,
): Promise<string> {
  const migrationName = `${camelCase(name, true)}${timestamp}`;
  const defineSchema = schema_type !== 'backoffice';
  const fileContent = `import { MigrationInterface, QueryRunner } from 'typeorm';
    ${defineSchema ? `import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';` : ''}


export class ${migrationName} implements MigrationInterface {
  name = '${migrationName}'

  public async up(queryRunner: QueryRunner): Promise<void> {
    ${defineSchema ? `const { schema } = queryRunner.connection.options as PostgresConnectionOptions;` : ''}
    ${upSqls.join('\n')}
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    ${defineSchema ? `const { schema } = queryRunner.connection.options as PostgresConnectionOptions;` : ''}
    ${downSqls.join('\n')}
  }
}
`;
  return prettier.format(fileContent, {
    parser: 'typescript',
    singleQuote: true,
  });
}
