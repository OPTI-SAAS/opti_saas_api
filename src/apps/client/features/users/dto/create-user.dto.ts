import { BoCreateUserDto } from '@lib/shared/dto/bo/create-user.bo.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsOptional, IsUUID } from 'class-validator';

export class CreateUserDto extends BoCreateUserDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  @ApiPropertyOptional({
    description: 'Array of tenant IDs to assign the user to',
    example: ['39182062-6c22-470e-b335-946b4db5f8dc'],
    type: [String],
  })
  tenantIds?: string[];
}
