import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsDefined,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

import { CreateProductBaseDto } from '../../products/dto/create-product.dto';

export class CreateBulkNewProductLineDto extends CreateProductBaseDto {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000020' })
  @IsUUID()
  @IsDefined()
  warehouseId!: string;

  @ApiProperty({ example: 5, minimum: 1 })
  @IsInt()
  @Min(1)
  @IsDefined()
  quantity!: number;

  @ApiProperty({ example: 42.5, minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsDefined()
  purchasePrice!: number;

  @ApiPropertyOptional({ example: 'SUP-NEW-001', nullable: true })
  @IsString()
  @IsOptional()
  productReferanceCode?: string;
}

export class CreateBulkExistingProductLineDto {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000010' })
  @IsUUID()
  @IsDefined()
  productId!: string;

  @ApiProperty({ example: '00000000-0000-0000-0000-000000000020' })
  @IsUUID()
  @IsDefined()
  warehouseId!: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @IsInt()
  @Min(1)
  @IsDefined()
  quantity!: number;

  @ApiProperty({ example: 35, minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsDefined()
  purchasePrice!: number;
}

export class CreateBulkStockReceiptDto {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000001' })
  @IsUUID()
  @IsDefined()
  supplierId!: string;

  @ApiPropertyOptional({
    example: '00000000-0000-0000-0000-000000000099',
    nullable: true,
  })
  @IsUUID()
  @IsOptional()
  fileId?: string;

  @ApiPropertyOptional({
    type: () => CreateBulkNewProductLineDto,
    isArray: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBulkNewProductLineDto)
  @IsOptional()
  newProducts?: CreateBulkNewProductLineDto[];

  @ApiPropertyOptional({
    type: () => CreateBulkExistingProductLineDto,
    isArray: true,
  })
  @IsArray()
  @ArrayUnique(
    (item: CreateBulkExistingProductLineDto) =>
      `${item.productId}:${item.warehouseId}`,
  )
  @ValidateNested({ each: true })
  @Type(() => CreateBulkExistingProductLineDto)
  @IsOptional()
  existingProducts?: CreateBulkExistingProductLineDto[];
}

export type BulkValidationErrorItem = {
  array: 'newProducts' | 'existingProducts';
  index: number;
  field: string;
  message: string;
  code?: string;
};
