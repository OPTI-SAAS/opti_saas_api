import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ResourceAuthorizations } from '@optisaas/opti-saas-lib';
import { Request } from 'express';

const AUTHORIZE_METADATA_KEY = 'AUTHORIZE_METADATA_KEY';
type AuthorizeMetadata = {
  requiredAuthorizations: ResourceAuthorizations[][];
  allGroupsRequired?: boolean;
  deepCheck?: boolean;
};

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const { requiredAuthorizations, allGroupsRequired, deepCheck } =
      this.reflector.get<AuthorizeMetadata>(
        AUTHORIZE_METADATA_KEY,
        context.getHandler(),
      );

    if (!requiredAuthorizations || requiredAuthorizations.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<
        Request & { user: { authorizations: ResourceAuthorizations[] } }
      >();
    const user = request.user;

    if (!user || !user.authorizations) {
      throw new ForbiddenException('User not authorized');
    }

    const hasValidAuthorization = this.checkAuthorizationGroups(
      requiredAuthorizations,
      user.authorizations,
      allGroupsRequired,
      deepCheck,
    );

    if (!hasValidAuthorization) {
      throw new ForbiddenException(
        'Access denied due to insufficient authorizations',
      );
    }

    return true;
  }

  private checkAuthorizationGroups(
    requiredAuthorizations: ResourceAuthorizations[][],
    userAuthorizations: ResourceAuthorizations[],
    allGroupsRequired: boolean = false,
    deepCheck: boolean = false,
  ): boolean {
    return allGroupsRequired
      ? requiredAuthorizations.every((group) =>
          this.checkAuthorization(group, userAuthorizations, deepCheck),
        )
      : requiredAuthorizations.some((group) =>
          this.checkAuthorization(group, userAuthorizations, deepCheck),
        );
  }

  private checkAuthorization(
    group: ResourceAuthorizations[],
    userAuthorizations: ResourceAuthorizations[],
    deepCheck: boolean,
  ): boolean {
    if (deepCheck) {
      return group.every((auth) => userAuthorizations.includes(auth));
    } else {
      return group.some((auth) => userAuthorizations.includes(auth));
    }
  }
}

export const Authorize = (
  authorizations: ResourceAuthorizations[],
  deepCheck: boolean = false,
) => {
  return (target: object, key: string, descriptor: PropertyDescriptor) => {
    SetMetadata(AUTHORIZE_METADATA_KEY, {
      requiredAuthorizations: [authorizations],
      deepCheck,
    })(target, key, descriptor);
    UseGuards(AuthorizationGuard)(target, key, descriptor);
  };
};

export const AuthorizeGroup = (
  requiredAuthorizations: ResourceAuthorizations[][],
  allGroupsRequired: boolean = false,
  deepCheck: boolean = false,
) => {
  return function (
    target: object,
    key: string,
    descriptor: PropertyDescriptor,
  ) {
    SetMetadata(AUTHORIZE_METADATA_KEY, {
      requiredAuthorizations,
      allGroupsRequired,
      deepCheck,
    })(target, key, descriptor);
    UseGuards(AuthorizationGuard)(target, key, descriptor);
  };
};
