import { CLIENT_USER_PASSWORD_REGEX } from '@lib/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsAlphanumeric,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

/**
 * DTO for creating a new user.
 * Note: This endpoint only creates the user record without assigning any tenant or role.
 */
export class CreateUserDto {
  @IsNotEmpty()
  @MaxLength(100)
  @IsAlphanumeric()
  @ApiProperty({
    description: 'First name of the user',
    example: 'John',
  })
  firstName!: string;

  @IsOptional()
  @MaxLength(100)
  @IsAlphanumeric()
  @ApiPropertyOptional({
    description: 'Last name of the user',
    example: 'Doe',
  })
  lastName?: string;

  @IsNotEmpty()
  @IsEmail()
  @MaxLength(100)
  @ApiProperty({
    description: 'Email address of the user (must be unique)',
    example: 'john.doe@example.com',
  })
  email!: string;

  @IsNotEmpty()
  @Matches(CLIENT_USER_PASSWORD_REGEX, { message: 'Password too weak' })
  @Length(6, 20)
  @ApiProperty({
    description: 'Password for the user account',
    example: 'SecurePass123',
  })
  password!: string;
}
