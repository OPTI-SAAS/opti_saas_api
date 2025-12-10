import { ApiProperty } from '@nestjs/swagger';
import {
  IsAlphanumeric,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  Length,
  Matches,
  MaxLength,
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
}
