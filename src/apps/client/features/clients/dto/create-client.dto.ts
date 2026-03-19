import { CLIENT_TYPES } from '@lib/shared/enums/client/client.client.enum';
import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDefined,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

import { CreateContactInterneDto } from './contact-interne.dto';
import { ConventionDto } from './convention.dto';
import { CreateClientBaseDto } from './create-client-base.dto';
import { CreateTutorPayloadDto } from './create-tutor-payload.dto';

export class CreateClientDto extends CreateClientBaseDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Referral/sponsor client ID',
  })
  @IsUUID()
  @IsOptional()
  sponsorId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Existing tutor/legal guardian client ID',
  })
  @IsUUID()
  @IsOptional()
  tutorId?: string;

  @ApiPropertyOptional({
    type: () => CreateTutorPayloadDto,
    description: 'Inline tutor creation payload',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateTutorPayloadDto)
  tutorPayload?: CreateTutorPayloadDto;

  @ApiPropertyOptional({
    example: false,
    description: "If true, use the tutor's family group for the new client",
  })
  @IsBoolean()
  @IsOptional()
  useTutorFamily?: boolean;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID()
  @IsOptional()
  familyGroupId?: string;

  @ApiPropertyOptional({
    type: () => ConventionDto,
    description:
      'Optional convention to create along with a professionnel client',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ConventionDto)
  convention?: ConventionDto;

  @ApiPropertyOptional({
    type: () => [CreateContactInterneDto],
    description:
      'Optional internal contacts to create along with a professionnel client',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateContactInterneDto)
  contacts?: CreateContactInterneDto[];
}

export class CreateParticulierClientDto extends OmitType(CreateClientDto, [
  'companyName',
  'taxId',
  'ice',
  'commercialRegister',
  'tradeLicense',
  'vatExempt',
] as const) {
  @ApiProperty({
    enum: [CLIENT_TYPES.PARTICULIER],
    example: CLIENT_TYPES.PARTICULIER,
  })
  @IsString()
  @IsDefined()
  type!: typeof CLIENT_TYPES.PARTICULIER;
}

export class CreateProfessionnelClientDto extends OmitType(CreateClientDto, [
  'passager',
  'isMinor',
  'title',
  'lastName',
  'firstName',
  'birthDate',
  'spouseName',
  'idDocumentType',
  'idDocumentNumber',
  'familyLink',
  'isOpticalBeneficiary',
  'isFinancialResponsible',
  'hasSharedMutual',
  'hasSharedAddress',
  'hasSocialCoverage',
  'coverageType',
  'membershipNumber',
  'medicalRecord',
  'sponsorId',
  'tutorId',
  'tutorPayload',
  'useTutorFamily',
  'familyGroupId',
] as const) {
  @ApiProperty({
    enum: [CLIENT_TYPES.PROFESSIONNEL],
    example: CLIENT_TYPES.PROFESSIONNEL,
  })
  @IsString()
  @IsDefined()
  type!: typeof CLIENT_TYPES.PROFESSIONNEL;
}
