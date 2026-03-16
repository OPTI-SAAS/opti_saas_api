import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { BaseResponseDto } from '../../base';

export class BoUserResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'John' })
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  lastName?: string;

  @ApiProperty({ example: 'johnDoe@gmail.com' })
  email!: string;

  @ApiPropertyOptional({ example: '612345678' })
  mobilePhone?: string;

  @ApiPropertyOptional({ example: '+33' })
  mobileCountryCode?: string;

  @ApiPropertyOptional({ example: null })
  agreement?: string;

  @ApiProperty({ example: true })
  active!: boolean;

  @ApiPropertyOptional({ example: '2026-03-04T12:00:00.000Z' })
  lastLoginAt?: Date;
}

export class BoUserWithRelationsResponseDto extends BoUserResponseDto {
  @ApiProperty()
  extra_field_example!: string;
}
