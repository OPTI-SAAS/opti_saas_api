import { CLIENT_USER_PASSWORD_REGEX } from '@lib/shared/constants';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsAlphanumeric,
  IsArray,
  IsOptional,
  IsUUID,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

/**
 * DTO for updating a user.
 * - Regular users can only update their own firstName, lastName, and password
 * - Owners can also update tenantIds for any user
 */
export class UpdateUserDto {
  @IsOptional()
  @MaxLength(100)
  @IsAlphanumeric()
  @ApiPropertyOptional({
    description: 'First name of the user',
    example: 'John',
    maxLength: 100,
  })
  firstName?: string;

  @IsOptional()
  @MaxLength(100)
  @IsAlphanumeric()
  @ApiPropertyOptional({
    description: 'Last name of the user',
    example: 'Doe',
    maxLength: 100,
  })
  lastName?: string;

  @IsOptional()
  @Length(6, 20, {
    message: 'Password must be between 6 and 20 characters',
  })
  @Matches(CLIENT_USER_PASSWORD_REGEX, {
    message:
      'Password must contain at least one uppercase letter (A-Z), one lowercase letter (a-z), and one number (0-9) or special character (!@#$%^&*)',
  })
  @ApiPropertyOptional({
    description:
      'New password for the user. Must be 6-20 characters with at least one uppercase, one lowercase, and one number or special character. Users can only update their own password.',
    example: 'NewSecurePass123',
    minLength: 6,
    maxLength: 20,
  })
  password?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @ApiPropertyOptional({
    description:
      'Array of tenant IDs to assign the user to. Only owners can update this field. This will replace all existing tenant assignments.',
    example: ['39182062-6c22-470e-b335-946b4db5f8dc'],
    type: [String],
  })
  tenantIds?: string[];
}
