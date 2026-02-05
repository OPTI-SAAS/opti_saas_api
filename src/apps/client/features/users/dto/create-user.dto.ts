import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  MaxLength,
} from 'class-validator';

/**
 * Base DTO with common user fields that can be shared/extended
 */
export class BaseUserFieldsDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  @ApiProperty({
    description: 'First name of the user (required, non-empty)',
    example: 'John',
  })
  firstName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiPropertyOptional({
    description:
      'Last name of the user (optional, defaults to empty string if not provided)',
    example: 'Doe',
  })
  lastName?: string;
}

/**
 * DTO for creating a new user.
 * Extends BaseUserFieldsDto with email and password fields.
 * Note: This endpoint only creates the user record without assigning any tenant or role.
 */
export class CreateUserDto extends BaseUserFieldsDto {
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(100)
  @ApiProperty({
    description: 'Email address of the user (must be unique)',
    example: 'john.doe@example.com',
  })
  email!: string;

  @IsNotEmpty()
  @IsStrongPassword()
  @ApiProperty({
    description: 'Password for the user account',
    example: 'SecurePass123!',
  })
  password!: string;
}
