import { PaginationQueryDto } from '@lib/shared/dto/pagination-query.dto';
import { ClientTypeValues } from '@lib/shared/enums/client/client.client.enum';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class QueryClientsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ClientTypeValues })
  @IsString()
  @IsEnum(ClientTypeValues)
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }): boolean => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value as boolean;
  })
  active?: boolean = true;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID()
  @IsOptional()
  familyGroupId?: string;
}
