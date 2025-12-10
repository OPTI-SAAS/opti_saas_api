import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();

    const statusCode = exception.getStatus
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorMessage =
      exception.message || 'Something went wrong, retry later!';

    const exceptionResponse = exception.getResponse() as {
      error_code?: string;
      message?: string;
      detail?: string;
    };
    const validatorsErrors =
      exceptionResponse?.message &&
      typeof exceptionResponse.message !== 'string'
        ? exceptionResponse.message
        : undefined;
    const errorCode = exceptionResponse?.error_code;
    const errorTrace = exceptionResponse?.detail;

    response.status(statusCode).json({
      status: statusCode, // status code
      error_code: errorCode, // error code
      message: errorMessage, // custom error message
      errors: validatorsErrors, // class validators errors
      trace: errorTrace, // error trace
      timestamp: new Date().toISOString(),
    });
  }
}
