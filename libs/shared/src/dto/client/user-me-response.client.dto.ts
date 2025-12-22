import { ApiProperty } from '@nestjs/swagger';

import { BaseResponseDto } from '../../base';
import { TenantResponseDto } from './tenant-response.client.dto';

/**
 * DTO representing the current authenticated user with their tenant memberships.
 * Used for the /auth/me endpoint response.
 */
export class UserMeResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: 'Email address of the user',
    example: 'user@tenant.com',
    format: 'email',
  })
  email!: string;

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
    description:
      'Indicates if the user is an owner. Always false for this endpoint as owners are blocked.',
    example: false,
  })
  isOwner!: boolean;

  @ApiProperty({
    description: 'List of tenants the user has access to',
    type: () => [TenantResponseDto],
  })
  tenants!: TenantResponseDto[];
}
