import { DataSource, Repository } from 'typeorm';

import { BoTenant } from '../../../entities';
import { BACKOFFICE_CONNECTION } from '../database.constant';

// TODO: prefix with BO

export const TENANT_REPOSITORY_TOKEN = 'TenantRepositoryToken';

export const TenantRepositoryProvider = {
  provide: TENANT_REPOSITORY_TOKEN,
  useFactory: (dataSource: DataSource): Repository<BoTenant> => {
    return dataSource.getRepository(BoTenant);
  },
  inject: [BACKOFFICE_CONNECTION],
};
