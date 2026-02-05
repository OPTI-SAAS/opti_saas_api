import { PartialType, PickType } from '@nestjs/swagger';

import { BaseUserFieldsDto } from './create-user.dto';

/**
 * DTO for updating user information.
 * Uses TypeScript mapped types: PartialType + PickType from BaseUserFieldsDto
 * - Only firstName and lastName can be updated (no email/password)
 * - All fields are optional (empty objects = no-op update)
 * - lastName can be null (to clear) or string
 *
 * Password changes are managed via a separate endpoint.
 * Tenant and role assignments are managed via assign_role endpoint.
 */
export class UpdateUserDto extends PartialType(
  PickType(BaseUserFieldsDto, ['firstName', 'lastName'] as const),
) {}
