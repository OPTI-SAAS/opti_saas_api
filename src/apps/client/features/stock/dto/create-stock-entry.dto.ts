import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDefined,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateStockEntryLineDto {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000010' })
  @IsUUID()
  @IsDefined()
  productId!: string;

  @ApiProperty({ example: '00000000-0000-0000-0000-000000000020' })
  @IsUUID()
  @IsDefined()
  warehouseId!: string;

  @ApiProperty({ example: 5, minimum: 1 })
  @IsInt()
  @Min(1)
  @IsDefined()
  quantity!: number;
}

export class CreateStockEntryDto {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000001' })
  @IsUUID()
  @IsDefined()
  supplierId!: string;

  @ApiPropertyOptional({ example: 'Invoice INV-2026-001' })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiProperty({
    type: () => CreateStockEntryLineDto,
    isArray: true,
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateStockEntryLineDto)
  @IsDefined()
  lines!: CreateStockEntryLineDto[];
}
