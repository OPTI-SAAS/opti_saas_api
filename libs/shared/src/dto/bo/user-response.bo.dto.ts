import { ApiProperty } from '@nestjs/swagger';

import { BaseResponseDto } from '../../base';
import { TBoUserStatus } from '../../enums/backoffice/users.bo.enum';

export class BoUserResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'John' })
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  lastName?: string;

  @ApiProperty({ example: 'johnDoe@gmail.com' })
  email!: string;

  @ApiProperty({ example: 'active' })
  status!: TBoUserStatus;
}

export class BoUserWithRelationsResponseDto extends BoUserResponseDto {
  @ApiProperty()
  extra_field_example!: string;
}
