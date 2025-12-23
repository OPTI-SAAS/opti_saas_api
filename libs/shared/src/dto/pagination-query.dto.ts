import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiProperty({ example: 1, default: 1, minimum: 1, required: false })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @ApiProperty({
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
    required: false,
  })
  limit?: number = 10;
}

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 50 })
  total!: number;

  @ApiProperty({ example: 5 })
  pages!: number;

  @ApiProperty({ example: false })
  hasPrev!: boolean;

  @ApiProperty({ example: true })
  hasNext!: boolean;
}
