import { PaginationQueryDto } from '@lib/shared/dto/pagination-query.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class QueryFamilySearchDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'Casablanca' })
  @IsString()
  @IsOptional()
  familyAddress?: string;

  @ApiPropertyOptional({ example: '0612345678' })
  @IsString()
  @IsOptional()
  participantPhone?: string;

  @ApiPropertyOptional({ example: 'Benali' })
  @IsString()
  @IsOptional()
  participantName?: string;
}
