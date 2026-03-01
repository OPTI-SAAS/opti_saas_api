import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({ example: 'user.admin@example.com' })
  readonly email!: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'Password-123' })
  readonly password!: string;
}
