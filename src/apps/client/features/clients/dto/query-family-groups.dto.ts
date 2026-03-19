import { PaginationQueryDto } from '@lib/shared/dto/pagination-query.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class QueryFamilyGroupsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'Benali' })
  @IsString()
  @IsOptional()
  nom?: string;

  @ApiPropertyOptional({ example: 'Casablanca' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Benali' })
  @IsString()
  @IsOptional()
  memberName?: string;

  @ApiPropertyOptional({ example: '0612345678' })
  @IsString()
  @IsOptional()
  memberPhone?: string;
}
