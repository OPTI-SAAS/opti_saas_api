import { BoUser, PaginationMetaDto } from '@lib/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Role info within a tenant
 */
export class RoleInfoDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id!: string;

  @ApiProperty({ example: 'Admin' })
  name!: string;
}

/**
 * Tenant with optional role assignment
 */
export class TenantWithRoleDto {
  @ApiProperty({ example: '39182062-6c22-470e-b335-946b4db5f8dc' })
  id!: string;

  @ApiProperty({ example: 'Acme Corp' })
  name!: string;

  @ApiPropertyOptional({ type: RoleInfoDto })
  role?: RoleInfoDto;
}

/**
 * Paginated users response (BoUser with tenants - @Exclude handles serialization)
 */
export class PaginatedUsersResponseDto {
  @ApiProperty({
    type: [BoUser],
    description: 'List of users with tenants and roles',
  })
  data!: (BoUser & { tenants: TenantWithRoleDto[] })[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
