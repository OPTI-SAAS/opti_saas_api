import { Controller } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';

import { TENANT_HEADER } from '../constants';

export const BackofficeController = (route: string) =>
  Controller(`backoffice/${route}`);

export const ClientController = (route: string) =>
  Controller(`client/${route}`);

const TENANT_HEADER_SCHEMA = {
  name: TENANT_HEADER,
  description:
    'Tenant ID to filter results by. Must be a UUID of a tenant the user has access to.',
  required: false,
  schema: { type: 'string', format: 'uuid' },
};
export const TenantApiHeader = () => ApiHeader(TENANT_HEADER_SCHEMA);
