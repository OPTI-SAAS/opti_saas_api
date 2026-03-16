import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  MaxLength,
  ValidateIf,
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

  @ValidateIf((o) => !!o.mobileCountryCode || !!o.mobilePhone)
  @IsNotEmpty({
    message: 'mobilePhone is required when mobileCountryCode is provided',
  })
  @IsString()
  @MaxLength(20)
  @ApiPropertyOptional({
    description:
      'Mobile phone number of the user (optional, E.164 format recommended)',
    example: '612345678',
  })
  mobilePhone?: string;

  @ValidateIf((o) => !!o.mobileCountryCode || !!o.mobilePhone)
  @IsNotEmpty({
    message: 'mobileCountryCode is required when mobilePhone is provided',
  })
  @IsString()
  @MaxLength(10)
  @ApiPropertyOptional({
    description:
      'Country code prefix for the mobile phone (required when mobilePhone is provided)',
    example: '+33',
  })
  mobileCountryCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiPropertyOptional({
    description: 'Agreement reference (optional)',
    example: null,
  })
  agreement?: string;
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
