import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { Request } from 'express';

import { TENANT_HEADER } from '../constants';

export const CurrentTenant = createParamDecorator(
  (required: boolean = true, context: ExecutionContext): string | undefined => {
    const request = context.switchToHttp().getRequest<Request>();
    const tenantId = request.headers[TENANT_HEADER] as string | undefined;

    if (!tenantId && required) {
      throw new BadRequestException(
        `Missing required header: ${TENANT_HEADER}`,
      );
    }

    return tenantId;
  },
);
