import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDefined,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { CreateAddressDto } from '../../warehouses/dto/create-warehouse.dto';

export class CreateFamilyGroupDto {
  @ApiProperty({ example: 'Famille Benali' })
  @IsString()
  @IsDefined()
  nom!: string;

  @ApiPropertyOptional({ type: () => CreateAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateAddressDto)
  address?: CreateAddressDto;

  @ApiPropertyOptional({ example: 'Famille résidant à Casablanca' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateFamilyGroupDto extends PartialType(CreateFamilyGroupDto) {}
