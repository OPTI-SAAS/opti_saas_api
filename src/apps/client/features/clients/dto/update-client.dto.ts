import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsUUID, ValidateNested } from 'class-validator';

import { CreateContactInterneDto } from './contact-interne.dto';
import { ConventionDto } from './convention.dto';
import { CreateClientBaseDto } from './create-client-base.dto';

export class UpdateClientDto extends PartialType(
  OmitType(CreateClientBaseDto, ['type'] as const),
) {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID()
  @IsOptional()
  familyGroupId?: string;

  @IsUUID()
  @IsOptional()
  sponsorId?: string;

  @IsUUID()
  @IsOptional()
  tutorId?: string;

  @ApiPropertyOptional({
    type: () => ConventionDto,
    description: 'Convention to create or update for a professionnel client',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ConventionDto)
  convention?: ConventionDto;

  @ApiPropertyOptional({
    type: () => [CreateContactInterneDto],
    description: 'Internal contacts to replace for a professionnel client',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateContactInterneDto)
  contacts?: CreateContactInterneDto[];
}
