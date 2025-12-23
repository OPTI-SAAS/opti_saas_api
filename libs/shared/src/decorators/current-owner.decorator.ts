import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

import { BoUser } from '../entities/backoffice';

interface RequestWithUser extends Request {
  user?: BoUser;
}

export const CurrentOwner = createParamDecorator(
  (data: unknown, context: ExecutionContext): BoUser => {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    return request.user as BoUser;
  },
);
