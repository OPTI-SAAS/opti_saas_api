import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
config();

const configService = new ConfigService();

export const getDBSourceOptions = (
  innerConfigService: ConfigService = configService,
): PostgresConnectionOptions => {
  const isLocal = configService.get('NODE_ENV') === 'local';
  const ssl = isLocal
    ? {}
    : {
        ssl: true,
        extra: {
          ssl: {
            rejectUnauthorized: false,
          },
        },
      };
  return {
    type: 'postgres',
    url: innerConfigService.get<string>('TYPEORM_URL'),
    logging: true,
    synchronize: false,
    migrationsRun: false,
    uuidExtension: 'uuid-ossp',
    ...ssl,
  };
};
