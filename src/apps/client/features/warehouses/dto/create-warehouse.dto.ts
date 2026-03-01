import {
  WAREHOUSE_TYPES,
  WarehouseType,
} from '@lib/shared/enums/client/warehouse.client.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDefined,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({ example: '12 Main Street' })
  @IsString()
  @IsDefined()
  street!: string;

  @ApiPropertyOptional({ example: 'Building B, 3rd floor' })
  @IsString()
  @IsOptional()
  streetLine2?: string;

  @ApiProperty({ example: '10001' })
  @IsString()
  @IsDefined()
  postcode!: string;

  @ApiProperty({ example: 'New York' })
  @IsString()
  @IsDefined()
  city!: string;

  @ApiProperty({ example: 'USA' })
  @IsString()
  @IsDefined()
  country!: string;

  @ApiPropertyOptional({ example: 40.7128 })
  @IsNumber()
  @IsOptional()
  lat?: number;

  @ApiPropertyOptional({ example: -74.006 })
  @IsNumber()
  @IsOptional()
  lon?: number;
}

export class CreateWarehouseDto {
  @ApiProperty({ example: 'Central Warehouse' })
  @IsString()
  @IsDefined()
  name!: string;

  @ApiPropertyOptional({ example: 500 })
  @IsNumber()
  @IsOptional()
  capacity?: number;

  @ApiProperty({ type: () => CreateAddressDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => CreateAddressDto)
  address!: CreateAddressDto;

  @ApiProperty({
    enum: Object.values(WAREHOUSE_TYPES),
    example: WAREHOUSE_TYPES.PRINCIPALE,
  })
  @IsString()
  @IsEnum(Object.values(WAREHOUSE_TYPES))
  @IsDefined()
  _type!: WarehouseType;
}
