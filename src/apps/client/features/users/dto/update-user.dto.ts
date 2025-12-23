import { BoCreateUserDto } from '@lib/shared/dto/bo/create-user.bo.dto';
import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsArray, IsOptional, IsUUID } from 'class-validator';

export class UpdateUserDto extends PartialType(
  OmitType(BoCreateUserDto, ['email']),
) {
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @ApiPropertyOptional({
    description: 'Array of tenant IDs to assign the user to (owners only)',
    example: ['39182062-6c22-470e-b335-946b4db5f8dc'],
    type: [String],
  })
  tenantIds?: string[];
}
