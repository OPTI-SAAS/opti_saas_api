import { ExtractEnumTypes } from '../../helpers';

export const BoUserStatus = {
  active: 'active',
  blocked: 'blocked',
  inactive: 'inactive',
  pending_invitation: 'pending_invitation',
} as const;
export type TBoUserStatus = ExtractEnumTypes<typeof BoUserStatus>;
