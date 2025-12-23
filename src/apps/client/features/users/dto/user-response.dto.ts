import { PaginationMetaDto, UserMeResponseDto } from '@lib/shared';
import { ApiProperty } from '@nestjs/swagger';

export class UserWithTenantsResponseDto extends UserMeResponseDto {}

export class PaginatedUsersResponseDto {
  @ApiProperty({ type: () => [UserWithTenantsResponseDto] })
  data!: UserWithTenantsResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
