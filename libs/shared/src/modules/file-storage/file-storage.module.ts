import { storageConfig } from '@lib/shared/config';
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { BoDatabaseModule } from '../database/database.bo.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { FileStorageService } from './file-storage.service';

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(storageConfig),
    TenancyModule,
    BoDatabaseModule,
  ],
  providers: [FileStorageService],
  exports: [FileStorageService],
})
export class FileStorageModule {}
