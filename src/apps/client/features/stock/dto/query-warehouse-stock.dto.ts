import { PaginationQueryDto } from '@lib/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class QueryWarehouseStockDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'ray',
    description: 'Search by product designation',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: 'frame',
    description: 'Filter by product type',
  })
  @IsOptional()
  @IsString()
  productType?: string;
}
