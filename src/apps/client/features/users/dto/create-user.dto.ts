import { ClCreateUserDto } from '@lib/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class CreateUserDto extends ClCreateUserDto {
  @IsOptional()
  @IsUUID('4')
  @ApiPropertyOptional({
    description: 'Tenant Group ID to assign to the user',
    example: '39182062-6c22-470e-b335-946b4db5f8dc',
    format: 'uuid',
  })
  tenantGroupId?: string;

  // roleId
}
