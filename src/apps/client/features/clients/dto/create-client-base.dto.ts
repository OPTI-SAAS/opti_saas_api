import {
  CivilitiesValues,
  CLIENT_TYPES,
  ClientTypeValues,
  FamilyLinkValues,
  IdDocumentTypeValues,
} from '@lib/shared/enums/client/client.client.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsDefined,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export class CreateClientBaseDto {
  @ApiProperty({
    enum: ClientTypeValues,
    example: CLIENT_TYPES.PARTICULIER,
  })
  @IsString()
  @IsEnum(ClientTypeValues)
  @IsDefined()
  type!: string;

  // --- Shared base fields ---

  @ApiPropertyOptional({ example: '0612345678' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'client@example.com' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'Casablanca' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: '123 Rue Mohammed V' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  passager?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isMinor?: boolean;

  // --- Particulier-specific fields (required when type = particulier) ---

  @ApiPropertyOptional({ enum: CivilitiesValues, example: 'Mr' })
  @ValidateIf((o) => o.type === CLIENT_TYPES.PARTICULIER && !o.passager)
  @IsString()
  @IsEnum(CivilitiesValues)
  @IsDefined()
  title?: string;

  @ApiPropertyOptional({ example: 'Benali' })
  @ValidateIf(
    (o) =>
      (o.type === CLIENT_TYPES.PARTICULIER && !o.passager) ||
      o.lastName !== undefined,
  )
  @IsString()
  @IsDefined({ message: 'lastName is required for particulier clients' })
  lastName?: string;

  @ApiPropertyOptional({ example: 'Youssef' })
  @ValidateIf(
    (o) =>
      (o.type === CLIENT_TYPES.PARTICULIER && !o.passager) ||
      o.firstName !== undefined,
  )
  @IsString()
  @IsDefined({ message: 'firstName is required for particulier clients' })
  firstName?: string;

  @ApiPropertyOptional({ example: '1990-05-15' })
  @ValidateIf((o) => o.type === CLIENT_TYPES.PARTICULIER && !o.passager)
  @Type(() => Date)
  @IsDate()
  @IsDefined()
  birthDate?: Date;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  spouseName?: string;

  @ApiPropertyOptional({ enum: IdDocumentTypeValues })
  @IsString()
  @IsEnum(IdDocumentTypeValues)
  @IsOptional()
  idDocumentType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  idDocumentNumber?: string;

  @ApiPropertyOptional({ enum: FamilyLinkValues })
  @IsString()
  @IsEnum(FamilyLinkValues)
  @IsOptional()
  familyLink?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isOpticalBeneficiary?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isFinancialResponsible?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  hasSharedMutual?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  hasSharedAddress?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  hasSocialCoverage?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  coverageType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  membershipNumber?: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    example: { currentlyWearing: 'glasses', hasDryness: true },
  })
  @IsObject()
  @IsOptional()
  medicalRecord?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  // --- Professionnel-specific fields (required when type = professionnel) ---

  @ApiPropertyOptional({ example: 'OptikVision SARL' })
  @ValidateIf((o) => o.type === CLIENT_TYPES.PROFESSIONNEL)
  @IsString()
  @IsDefined()
  companyName?: string;

  @ApiPropertyOptional({ example: '12345678' })
  @ValidateIf((o) => o.type === CLIENT_TYPES.PROFESSIONNEL)
  @IsString()
  @IsDefined()
  taxId?: string;

  @ApiPropertyOptional({ example: '001234567000012' })
  @ValidateIf((o) => o.type === CLIENT_TYPES.PROFESSIONNEL)
  @IsString()
  @IsDefined()
  ice?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  commercialRegister?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  tradeLicense?: string;

  @ApiPropertyOptional()
  @ValidateIf((o) => o.type === CLIENT_TYPES.PROFESSIONNEL)
  @IsBoolean()
  @IsDefined()
  vatExempt?: boolean;
}
