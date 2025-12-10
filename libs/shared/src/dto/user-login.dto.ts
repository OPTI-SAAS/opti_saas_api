import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class UserLoginDto {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({ example: 'johnDoe@gmail.com' })
  readonly email!: string;

  @IsNotEmpty()
  @ApiProperty({ example: '12345' })
  readonly password!: string;

  @IsOptional()
  @IsBoolean()
  @Transform(
    ({ value }) =>
      value === 'true' || value === true || value === 1 || value === '1',
  )
  @ApiProperty({ example: 'false' })
  readonly remember_me?: boolean;
}
