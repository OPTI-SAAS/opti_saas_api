import { TENANT_HEADER } from '@lib/shared/constants';
import {
  BadRequestException,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

import { TenantContext } from './tenant.context';

const TENANT_ID_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(private readonly tenantContext: TenantContext) {}

  use(request: Request, _res: Response, next: NextFunction) {
    const tenantId = this.extractTenantId(request);

    if (!tenantId) {
      console.error('Tenant ID is missing in request headers');
      next();
      return;
    }

    if (!TENANT_ID_REGEX.test(tenantId)) {
      throw new BadRequestException(
        'Invalid Tenant ID format. Must be alphanumeric with dashes/underscores and 1-64 characters long',
      );
    }

    // Run the rest of the request handling within the tenant context
    this.tenantContext.run(tenantId, () => {
      next();
    });
  }

  private extractTenantId(request: Request): string | undefined {
    const value = request.headers[TENANT_HEADER];
    if (value) {
      return Array.isArray(value) ? value[0] : value;
    }
    return undefined;
  }
}
