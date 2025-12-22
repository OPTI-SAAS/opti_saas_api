import { BaseResponseDto, TenantResponseDto } from '@lib/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO representing a user with their tenant memberships.
 * Used for the /users endpoints response.
 */
export class UserWithTenantsResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: 'First name of the user',
    example: 'John',
  })
  firstName!: string;

  @ApiProperty({
    description: 'Last name of the user',
    example: 'Doe',
  })
  lastName!: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john.doe@example.com',
    format: 'email',
  })
  email!: string;

  @ApiProperty({
    description:
      'Indicates if the user is an owner. Always false for tenant users.',
    example: false,
  })
  isOwner!: boolean;

  @ApiPropertyOptional({
    description: 'List of tenants the user has access to',
    type: () => [TenantResponseDto],
  })
  tenantMemberships?: {
    tenant: {
      id: string;
      name: string;
      dbSchema: string;
    };
  }[];
}

/**
 * Pagination meta information
 */
export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 50 })
  total!: number;

  @ApiProperty({ example: 5 })
  pages!: number;

  @ApiProperty({ example: false })
  hasPrev!: boolean;

  @ApiProperty({ example: true })
  hasNext!: boolean;
}

/**
 * Paginated users response
 */
export class PaginatedUsersResponseDto {
  @ApiProperty({
    description: 'List of users',
    type: () => [UserWithTenantsResponseDto],
  })
  data!: UserWithTenantsResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto,
  })
  meta!: PaginationMetaDto;
}
