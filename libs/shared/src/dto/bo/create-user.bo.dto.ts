import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsAlphanumeric,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

import { CLIENT_USER_PASSWORD_REGEX } from '../../constants';

export class BoCreateUserDto {
  @IsNotEmpty()
  @MaxLength(100)
  @IsAlphanumeric()
  @ApiProperty({ example: 'John' })
  firstName!: string;

  @IsOptional()
  @MaxLength(100)
  @IsAlphanumeric()
  @ApiProperty({ example: 'Doe' })
  lastName!: string;

  // TODO : add email unique validator
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(100)
  @ApiProperty({ example: 'johnDoe@gmail.com' })
  email!: string;

  @IsNotEmpty()
  @Matches(CLIENT_USER_PASSWORD_REGEX, { message: 'Password too weak' })
  @Length(6, 20)
  @ApiProperty({
    example: 'Hello12345',
  })
  password!: string;

  @ValidateIf((o) => !!o.mobileCountryCode || !!o.mobilePhone)
  @IsNotEmpty({
    message: 'mobilePhone is required when mobileCountryCode is provided',
  })
  @IsString()
  @MaxLength(20)
  @ApiPropertyOptional({ example: '612345678' })
  mobilePhone?: string;

  @ValidateIf((o) => !!o.mobileCountryCode || !!o.mobilePhone)
  @IsNotEmpty({
    message: 'mobileCountryCode is required when mobilePhone is provided',
  })
  @IsString()
  @MaxLength(10)
  @ApiPropertyOptional({ example: '+33' })
  mobileCountryCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiPropertyOptional({ example: null })
  agreement?: string;
}
