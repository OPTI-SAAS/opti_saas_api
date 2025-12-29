import { ClCreateUserDto } from '@lib/shared';
import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class CreateUserDto extends ClCreateUserDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  @ApiProperty({
    description: 'Array of Tenant IDs to assign the user to',
    example: ['9c5802c1-03f4-45ff-8ab6-094ed391ac95'],
    type: [String],
  })
  tenantIds!: string[];

  // roleId
}
