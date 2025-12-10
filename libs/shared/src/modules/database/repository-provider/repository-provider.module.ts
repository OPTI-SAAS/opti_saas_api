import { Module } from '@nestjs/common';

import { BoDatabaseModule } from '../database.bo.module';
import { TenantRepositoryProvider } from './tenant-repository.provider';
import { UserRepositoryProvider } from './user-repository.provider';

@Module({
  imports: [BoDatabaseModule],
  providers: [TenantRepositoryProvider, UserRepositoryProvider],
  exports: [TenantRepositoryProvider, UserRepositoryProvider],
})
export class RepositoriesModule {} // TODO: prefix with BO
