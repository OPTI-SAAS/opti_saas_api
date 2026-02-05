import { BoUser } from '@lib/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Tenant assignment with optional role ID
 * Simplified per Ayman's feedback: just { id, roleId }
 */
export class TenantWithRoleDto {
  @ApiProperty({ example: '39182062-6c22-470e-b335-946b4db5f8dc' })
  id!: string;

  @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  roleId?: string;
}

/**
 * Pagination meta without hasPrev/hasNext (frontend can calculate)
 */
export class SimplePaginationMeta {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 100 })
  total!: number;

  @ApiProperty({ example: 10 })
  pages!: number;
}

/**
 * Paginated users response (BoUser only - no tenant/role info in list)
 */
export class PaginatedUsersResponseDto {
  @ApiProperty({
    type: [BoUser],
    description: 'List of users',
  })
  data!: BoUser[];

  @ApiProperty({ type: SimplePaginationMeta })
  meta!: SimplePaginationMeta;
}
