import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({ example: 'user@example.com' })
  readonly email!: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'password123' })
  readonly password!: string;
}
