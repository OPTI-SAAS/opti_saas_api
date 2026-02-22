import {
  appConfig,
  FileStorageModule,
  getDBSourceOptions,
  jwtConfig,
  storageConfig,
} from '@lib/shared';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { BackofficeModule } from './backoffice/backoffice.module';
import { ClientModule } from './client/client.module';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      load: [appConfig, jwtConfig, storageConfig],
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        getDBSourceOptions(configService),
      inject: [ConfigService],
    }),
    FileStorageModule,
    BackofficeModule,
    ClientModule,
  ],
})
export class AppModule {}
