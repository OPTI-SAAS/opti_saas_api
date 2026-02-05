import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class RoleAssignmentDto {
  @IsNotEmpty()
  @IsUUID('4')
  @ApiProperty({
    description: 'The tenant ID to assign the role in',
    example: '39182062-6c22-470e-b335-946b4db5f8dc',
  })
  tenantId!: string;

  @IsNotEmpty()
  @IsUUID('4')
  @ApiProperty({
    description: 'The role ID to assign to the user',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  roleId!: string;
}

export class AssignRoleDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RoleAssignmentDto)
  @ApiProperty({
    description: 'Array of tenant-role assignments',
    type: [RoleAssignmentDto],
    example: [
      {
        tenantId: '39182062-6c22-470e-b335-946b4db5f8dc',
        roleId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      },
      {
        tenantId: '12345678-1234-1234-1234-123456789012',
        roleId: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
      },
    ],
  })
  assignments!: RoleAssignmentDto[];
}
