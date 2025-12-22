import { CLIENT_USER_PASSWORD_REGEX } from '@lib/shared/constants';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsAlphanumeric,
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @MaxLength(100)
  @IsAlphanumeric()
  @ApiProperty({
    description: 'First name of the user',
    example: 'John',
    maxLength: 100,
  })
  firstName!: string;

  @IsNotEmpty()
  @MaxLength(100)
  @IsAlphanumeric()
  @ApiProperty({
    description: 'Last name of the user',
    example: 'Doe',
    maxLength: 100,
  })
  lastName!: string;

  @IsNotEmpty()
  @IsEmail()
  @MaxLength(100)
  @ApiProperty({
    description: 'Email address of the user (must be unique)',
    example: 'john.doe@example.com',
    maxLength: 100,
  })
  email!: string;

  @IsNotEmpty()
  @Matches(CLIENT_USER_PASSWORD_REGEX, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number or special character',
  })
  @Length(6, 20)
  @ApiProperty({
    description:
      'Password for the user (6-20 characters, must contain uppercase, lowercase, and number/special char)',
    example: 'SecurePass123',
    minLength: 6,
    maxLength: 20,
  })
  password!: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  @ApiPropertyOptional({
    description:
      'Array of tenant IDs to assign the user to. Tenants must belong to the owner tenant group.',
    example: ['39182062-6c22-470e-b335-946b4db5f8dc'],
    type: [String],
  })
  tenantIds?: string[];
}
