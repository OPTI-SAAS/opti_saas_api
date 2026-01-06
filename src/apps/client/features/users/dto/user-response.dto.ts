import { BaseResponseDto, PaginationMetaDto } from '@lib/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Basic tenant info for user response
 */
export class TenantInfoDto {
  @ApiProperty({ example: '39182062-6c22-470e-b335-946b4db5f8dc' })
  id!: string;

  @ApiProperty({ example: 'Acme Corp' })
  name!: string;
}

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
 * Tenant with role assignment for a user
 */
export class TenantWithRoleDto extends TenantInfoDto {
  @ApiPropertyOptional({ type: RoleInfoDto })
  role?: RoleInfoDto;
}

/**
 * Basic user response DTO (for list and create/update)
 */
export class UserResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: 'First name of the user',
    example: 'John',
  })
  firstName!: string;

  @ApiPropertyOptional({
    description: 'Last name of the user',
    example: 'Doe',
  })
  lastName?: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john.doe@example.com',
  })
  email!: string;
}

/**
 * Extended user response with tenants (for list endpoint)
 */
export class UserWithTenantsResponseDto extends UserResponseDto {
  @ApiProperty({
    description: 'List of tenants the user belongs to',
    type: [TenantInfoDto],
  })
  tenants!: TenantInfoDto[];
}

/**
 * Full user response with tenant-role assignments (for GET /:id)
 */
export class UserWithRolesResponseDto extends UserResponseDto {
  @ApiProperty({
    description: 'List of tenants with their role assignments',
    type: [TenantWithRoleDto],
  })
  tenants!: TenantWithRoleDto[];
}

/**
 * Paginated users response
 */
export class PaginatedUsersResponseDto {
  @ApiProperty({ type: () => [UserWithTenantsResponseDto] })
  data!: UserWithTenantsResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
