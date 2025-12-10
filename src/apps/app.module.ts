import { appConfig, getDBSourceOptions, jwtConfig } from '@lib/shared';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { BackofficeModule } from './backoffice/backoffice.module';
import { ClientModule } from './client/client.module';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      load: [appConfig, jwtConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        getDBSourceOptions(configService),
      inject: [ConfigService],
    }),
    BackofficeModule,
    ClientModule,
  ],
})
export class AppModule {}
