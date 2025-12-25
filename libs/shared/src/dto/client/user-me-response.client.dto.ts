import { ApiProperty } from '@nestjs/swagger';

import { BaseResponseDto } from '../../base';
import { ClTenantResponseDto } from './tenant-response.client.dto';

/**
 * DTO representing the current authenticated user with their tenant memberships.
 * Used for the /auth/me endpoint response.
 */
export class ClUserMeResponseDto extends BaseResponseDto {
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
    description: 'List of tenants the user has access to',
    type: () => [ClTenantResponseDto],
  })
  tenants!: ClTenantResponseDto[];
}
