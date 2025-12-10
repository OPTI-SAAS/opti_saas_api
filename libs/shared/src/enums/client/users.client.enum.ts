import { ExtractEnumTypes } from '@lib/shared/helpers';

export const UserStatus = {
  active: 'active',
  blocked: 'blocked',
  inactive: 'inactive',
  pending_invitation: 'pending_invitation',
} as const;
export type TUserStatus = ExtractEnumTypes<typeof UserStatus>;
