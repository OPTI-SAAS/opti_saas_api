import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsAlphanumeric,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

import { CLIENT_USER_PASSWORD_REGEX } from '@lib/shared';

/**
 * DTO for updating user information.
 * Note: This endpoint only updates user info (firstName, lastName, password).
 * Tenant and role assignments are managed via separate endpoints.
 */
export class UpdateUserDto {
  @IsOptional()
  @MaxLength(100)
  @IsAlphanumeric()
  @ApiPropertyOptional({
    description: 'First name of the user',
    example: 'John',
  })
  firstName?: string;

  @IsOptional()
  @MaxLength(100)
  @IsAlphanumeric()
  @ApiPropertyOptional({
    description: 'Last name of the user',
    example: 'Doe',
  })
  lastName?: string;

  @IsOptional()
  @Matches(CLIENT_USER_PASSWORD_REGEX, { message: 'Password too weak' })
  @Length(6, 20)
  @ApiPropertyOptional({
    description: 'New password for the user account',
    example: 'NewSecurePass123',
  })
  password?: string;

  /**
   * Current password is required when updating password.
   * This ensures the user knows their current password before changing it.
   */
  @ValidateIf((o: UpdateUserDto) => o.password !== undefined)
  @IsNotEmpty({
    message: 'Current password is required when changing password',
  })
  @IsString()
  @ApiPropertyOptional({
    description: 'Current password (required when updating password)',
    example: 'OldPassword123',
  })
  currentPassword?: string;
}
