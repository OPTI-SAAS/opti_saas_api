import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsDefined, IsOptional, IsString } from 'class-validator';

export class CreateFamilyGroupDto {
  @ApiProperty({ example: 'Famille Benali' })
  @IsString()
  @IsDefined()
  nom!: string;

  @ApiPropertyOptional({ example: 'Famille résidant à Casablanca' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateFamilyGroupDto extends PartialType(CreateFamilyGroupDto) {}
