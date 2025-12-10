import { ApiProperty } from '@nestjs/swagger';

import { BoUserWithRelationsResponseDto } from './bo';
import { UserResponseDto } from './client';

export class UserLoginResponseDto<T> {
  @ApiProperty({ example: { accessToken: 'token' } })
  tokens!: { accessToken: string };

  @ApiProperty()
  user!: T;
}

export type BoUserLoginResponseDto =
  UserLoginResponseDto<BoUserWithRelationsResponseDto>;

export type ClientUserLoginResponseDto = UserLoginResponseDto<UserResponseDto>;
