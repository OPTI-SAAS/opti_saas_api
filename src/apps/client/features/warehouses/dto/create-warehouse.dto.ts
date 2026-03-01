import {
  WAREHOUSE_TYPES,
  WarehouseType,
} from '@lib/shared/enums/client/warehouse.client.enum';
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
  @IsString()
  @IsDefined()
  street!: string;

  @IsString()
  @IsOptional()
  streetLine2?: string;

  @IsString()
  @IsDefined()
  postcode!: string;

  @IsString()
  @IsDefined()
  city!: string;

  @IsString()
  @IsDefined()
  country!: string;

  @IsNumber()
  @IsOptional()
  lat?: number;

  @IsNumber()
  @IsOptional()
  lon?: number;
}

export class CreateWarehouseDto {
  @IsString()
  @IsDefined()
  name!: string;

  @IsNumber()
  @IsOptional()
  capacity?: number;

  @IsDefined()
  @ValidateNested()
  @Type(() => CreateAddressDto)
  address!: CreateAddressDto;

  @IsString()
  @IsEnum(Object.values(WAREHOUSE_TYPES))
  @IsDefined()
  _type!: WarehouseType;
}
