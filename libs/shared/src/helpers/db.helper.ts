import { DBErrorCode } from '@lib/shared/types';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as format from 'pg-format';
import { EntityNotFoundError } from 'typeorm';
import { QueryFailedError } from 'typeorm/error/QueryFailedError';

import { DB_SCHEMA_REGEX } from '../constants';
import { ExceptionErrorType } from '../types';

export function sanitizeDatabaseSchema(schema: string): string {
  if (!DB_SCHEMA_REGEX.test(schema)) {
    throw new BadRequestException({
      error_code: ExceptionErrorType.TenantIsInvalid,
      message: 'Tenant ID is invalid',
    });
  }
  return format('%I', schema); // escapes the identifier safely
}

export function handleDbError(error: any): never {
  // DB constraint errors
  if (error instanceof QueryFailedError) {
    const err = error as QueryFailedError & { code?: string; detail?: string };

    switch (err.code) {
      case DBErrorCode.PgUniqueConstraintViolation:
        throw new ConflictException({
          message: 'Unique constraint violated',
          detail: err.detail,
        });

      case DBErrorCode.PgForeignKeyConstraintViolation:
        throw new BadRequestException({
          message: 'Invalid reference (foreign key violation)',
          detail: err.detail,
        });

      case DBErrorCode.PgNotNullConstraintViolation:
        throw new BadRequestException({
          message: 'Missing required field (not null)',
          detail: err.detail,
        });

      default:
        throw new BadRequestException({
          message: 'Database constraint error',
          detail: err.detail,
        });
    }
  }

  // ORM errors ( findOneOrFail , findOneByOrFailBy... )
  if (error instanceof EntityNotFoundError) {
    const errorTrace =
      process.env.NODE_ENV === 'local' ? error.message : undefined; // Only show detailed error trace in local env
    throw new NotFoundException({
      message: 'Entity not found',
      detail: errorTrace?.replace(/\n/g, ''),
    });
  }

  throw error;
}

export function generateTenantSchemaName(tenantName: string): string {
  let base = tenantName
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');

  base = base
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '');

  if (!/^[a-z_]/.test(base)) {
    base = `tenant_${base}`;
  }

  const ts = Date.now().toString();
  const suffix = `_${ts}`;

  base = base.substring(0, 63 - suffix.length);

  return `${base}${suffix}`;
}
