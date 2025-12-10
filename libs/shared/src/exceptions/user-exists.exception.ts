import { ConflictException } from '@nestjs/common';

import { ExceptionErrorType } from '../types';

export class UserExistsException extends ConflictException {
  constructor(email: string) {
    super({
      error_code: ExceptionErrorType.UserExists,
      message: `This email '${email}' already exists`,
    });
  }
}
