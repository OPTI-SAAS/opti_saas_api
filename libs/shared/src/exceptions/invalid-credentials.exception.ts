import { UnauthorizedException } from '@nestjs/common';

import { ExceptionErrorType } from '../types';

export class InvalidCredentialsException extends UnauthorizedException {
  constructor() {
    super({
      error_code: ExceptionErrorType.InvalidCredentials,
      message: 'Invalid credentials',
    });
  }
}
