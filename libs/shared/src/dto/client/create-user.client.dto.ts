import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsAlphanumeric,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

import { CLIENT_USER_PASSWORD_REGEX } from '../../constants';

export class CreateUserDto {
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

  @IsOptional()
  @IsBoolean()
  @Transform(
    ({ value }) =>
      value === 'true' || value === true || value === 1 || value === '1',
  )
  @ApiProperty({ example: 'true' })
  isOwner?: boolean;
}
