import { ApiProperty } from '@nestjs/swagger';

import { BaseResponseDto } from '../../base';
import { TUserStatus } from '../../enums/client';

export class UserResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'John' })
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  lastName!: string;

  @ApiProperty({ example: 'johnDoe@gmail.com' })
  email!: string;

  @ApiProperty({ example: 'active' })
  status!: TUserStatus;

  @ApiProperty({ example: false })
  isOwner?: boolean;
}
