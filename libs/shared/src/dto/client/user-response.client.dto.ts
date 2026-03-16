import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { BaseResponseDto } from '../../base';

export class UserResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'John' })
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  lastName!: string;

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

  @ApiProperty({ example: false })
  isOwner?: boolean;
}
