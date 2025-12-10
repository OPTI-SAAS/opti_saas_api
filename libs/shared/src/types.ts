import { ExtractEnumTypes } from './helpers';

export const DBErrorCode = {
  PgUniqueConstraintViolation: '23505',
  PgNotNullConstraintViolation: '23502',
  PgForeignKeyConstraintViolation: '23503',
} as const;
export type TDBErrorCode = ExtractEnumTypes<typeof DBErrorCode>;

export const ExceptionErrorType = {
  // ** db
  ForeignKeyConflict: 'FOREIGN_KEY_CONFLICT',
  TenantIsRequired: 'TENANT_ID_REQUIRED',
  TenantIsInvalid: 'TENANT_ID_INVALID',
  TenantNotFound: 'TENANT_ID_NOT_FOUND',
  // ** users
  UserExists: 'USER_EXISTS',
  BlockedUser: 'BLOCKED_USER',
  InactiveUser: 'INACTIVE_USER',
  // ** auth
  InvalidToken: 'INVALID_TOKEN',
  InvalidCredentials: 'INVALID_CREDENTIALS',
} as const;
export type TExceptionErrorType = ExtractEnumTypes<typeof ExceptionErrorType>;

export type TPaginatedData<TData> = {
  data: TData[];
  meta: {
    page: number;
    total: number;
    limit: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};
