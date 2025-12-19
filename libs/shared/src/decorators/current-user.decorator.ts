import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface AuthenticatedUser {
  userId: string;
  email: string;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest<Request>();
    return request.user as AuthenticatedUser;
  },
);
