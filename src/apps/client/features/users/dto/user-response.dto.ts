import { ClUserMeResponseDto, PaginationMetaDto } from '@lib/shared';
import { ApiProperty } from '@nestjs/swagger';

export class UserWithTenantsResponseDto extends ClUserMeResponseDto {}

export class PaginatedUsersResponseDto {
  @ApiProperty({ type: () => [UserWithTenantsResponseDto] })
  data!: UserWithTenantsResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
