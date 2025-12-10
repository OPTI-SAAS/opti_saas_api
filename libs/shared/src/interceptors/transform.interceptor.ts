import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs/internal/Observable';
import { map } from 'rxjs/internal/operators/map';

import { isPaginatedData } from '../helpers';

export enum Message {
  DEFAULT = 'Success !',
  CREATED = 'Created successfully !',
  UPDATED = 'Updated successfully !',
  DELETED = 'Deleted successfully !',
  FOUND = 'Found successfully !',
  NOT_FOUND = 'Not found !',
  ALREADY_EXISTS = 'Item already exists !',
  INVALID_CREDENTIALS = 'Invalid credentials !',
  INVALID_TOKEN = 'Invalid token !',
  INVALID_REQUEST = 'Invalid request !',
  INVALID_PARAMETERS = 'Invalid parameters !',
}
export interface Response<T> {
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  Response<T>
> {
  private message!: string;

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const { method } = context.switchToHttp().getRequest<{ method: string }>();
    const { statusCode } = context
      .switchToHttp()
      .getResponse<{ statusCode: number }>();

    switch (method) {
      case 'GET':
        this.message = Message.FOUND;
        break;
      case 'POST':
        this.message =
          statusCode === +HttpStatus.CREATED
            ? Message.CREATED
            : Message.DEFAULT;
        break;
      case 'PUT':
        this.message = Message.UPDATED;
        break;
      case 'PATCH':
        this.message = Message.UPDATED;
        break;
      case 'DELETE':
        this.message = Message.DELETED;
        break;
      default:
        this.message = Message.DEFAULT;
    }

    return next.handle().pipe(
      map((data: T) => {
        if (isPaginatedData(data)) {
          return {
            status: statusCode,
            message: this.message,
            data: data.data as T,
            meta: data.meta,
          };
        }

        return {
          status: statusCode,
          message: this.message,
          data,
        };
      }),
    );
  }
}
