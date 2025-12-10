import { UnauthorizedException } from '@nestjs/common';

import { ExceptionErrorType } from '../types';

export class InvalidTokenException extends UnauthorizedException {
  constructor() {
    super({
      error_code: ExceptionErrorType.InvalidToken,
      message: 'Invalid or expired access token',
    });
  }
}
