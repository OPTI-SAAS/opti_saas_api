/* eslint-disable @typescript-eslint/no-floating-promises */
import {
  HttpExceptionFilter,
  TENANT_HEADER,
  TransformInterceptor,
} from '@lib/shared';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'body-parser';

import { AppModule } from './apps/app.module';
import { BackofficeModule } from './apps/backoffice/backoffice.module';
import { ClientModule } from './apps/client/client.module';

const globalPrefix = 'api';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      TENANT_HEADER,
    ],
    credentials: true, // Allow cookies and credentials
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  app
    .setGlobalPrefix(globalPrefix)
    .useGlobalInterceptors(new TransformInterceptor())
    .useGlobalFilters(new HttpExceptionFilter())
    .useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  const backofficeOptions = new DocumentBuilder()
    .setTitle('Backoffice Opti Saas Api')
    .setVersion('0.1')
    .build();
  const clientOptions = new DocumentBuilder()
    .setTitle('Client Opti Saas Api')
    .setVersion('0.1')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your JWT token',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const backofficeDocumentFactory = () =>
    SwaggerModule.createDocument(app, backofficeOptions, {
      include: [BackofficeModule],
      deepScanRoutes: true,
    });
  const clientDocumentFactory = () =>
    SwaggerModule.createDocument(app, clientOptions, {
      include: [ClientModule],
      deepScanRoutes: true,
    });

  SwaggerModule.setup('api/backoffice', app, backofficeDocumentFactory);
  SwaggerModule.setup('api/client', app, clientDocumentFactory);

  const configService = app.get<ConfigService>(ConfigService);
  const port = configService.get<number>('app.port') || 3000;
  Logger.log(`🚀 Application is running on: http://localhost:${port}`);

  await app.listen(port);
}
bootstrap();
