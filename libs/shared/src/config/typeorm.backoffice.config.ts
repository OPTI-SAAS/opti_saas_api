import * as path from 'node:path';

import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

import { getDBSourceOptions } from './typeorm.config';
config();

const configService = new ConfigService();

export const getBoSourceOptions = (
  innerConfigService: ConfigService = configService,
): PostgresConnectionOptions => ({
  ...getDBSourceOptions(innerConfigService),
  entities: [
    path.resolve(__dirname, '../entities/backoffice/*.bo.entity.{js,ts}'),
  ],
  migrations: [
    path.resolve(__dirname, '../migrations/backoffice/*-migration.{js,ts}'),
  ],
});

const BoDataSource = new DataSource(getBoSourceOptions());

export default BoDataSource;
