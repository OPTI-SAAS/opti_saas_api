import { ConflictException } from '@nestjs/common';

import { ExceptionErrorType } from '../types';

export class ForeignKeyConflictException extends ConflictException {
  constructor() {
    super({
      error_code: ExceptionErrorType.ForeignKeyConflict,
      message: 'Foreign key conflict',
    });
  }
}
