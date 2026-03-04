import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { BaseResponseDto } from '../../base';
import { TBoUserStatus } from '../../enums/backoffice/users.bo.enum';

export class BoUserResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'John' })
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  lastName?: string;

  @ApiProperty({ example: 'johnDoe@gmail.com' })
  email!: string;

  @ApiPropertyOptional({ example: '+33612345678' })
  mobile?: string;

  @ApiProperty({ example: 'active' })
  status!: TBoUserStatus;

  @ApiPropertyOptional({ example: '2026-03-04T12:00:00.000Z' })
  lastLoginAt?: Date;
}

export class BoUserWithRelationsResponseDto extends BoUserResponseDto {
  @ApiProperty()
  extra_field_example!: string;
}
