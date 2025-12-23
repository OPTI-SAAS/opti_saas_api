import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO representing a tenant in the system.
 * This is a public DTO that can be used across the application.
 */
export class TenantResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the tenant (UUID)',
    example: '39182062-6c22-470e-b335-946b4db5f8dc',
    format: 'uuid',
  })
  id!: string;

  @ApiProperty({
    description: 'Display name of the tenant',
    example: 'Optic ABC',
  })
  name!: string;

  @ApiProperty({
    description: 'Database schema name for tenant data isolation',
    example: 'tenant_optic_abc',
  })
  dbSchema!: string;
}
