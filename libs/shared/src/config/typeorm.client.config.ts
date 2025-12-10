import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

import { getDBSourceOptions } from './typeorm.config';
config();

const configService = new ConfigService();

export const getClientSourceOptions = (
  innerConfigService: ConfigService = configService,
): PostgresConnectionOptions => ({
  ...getDBSourceOptions(innerConfigService),
  entities: [
    path.resolve(__dirname, '../entities/client/*.client.entity.{js,ts}'),
  ],
  migrations: [
    path.resolve(__dirname, '../migrations/client/*-migration.{js,ts}'),
  ],
});

const CoDataSource = new DataSource(getClientSourceOptions());

export default CoDataSource;
