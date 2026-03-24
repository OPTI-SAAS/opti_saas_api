import {
  type Civilities,
  CivilitiesValues,
  CLIENT_TYPES,
  type ClientType,
  ClientTypeValues,
  type FamilyLink,
  FamilyLinkValues,
  type IdDocumentType,
  IdDocumentTypeValues,
} from '@lib/shared/enums/client/client.client.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsDefined,
  IsEmail,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export class CreateClientBaseDto {
  @ApiProperty({
    enum: ClientTypeValues,
    example: CLIENT_TYPES.INDIVIDUAL,
  })
  @IsString()
  @IsEnum(ClientTypeValues)
  @IsDefined()
  type!: ClientType;

  // --- Shared base fields ---

  @ApiPropertyOptional({ example: '0612345678' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'client@example.com' })
  @IsEmail({}, { message: 'email must be a valid email address' })
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
  walkIn?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isMinor?: boolean;

  // --- Particulier-specific fields (required when type = particulier) ---

  @ApiPropertyOptional({ enum: CivilitiesValues, example: 'Mr' })
  @ValidateIf((o) => o.type === CLIENT_TYPES.INDIVIDUAL && !o.walkIn)
  @IsString()
  @IsEnum(CivilitiesValues)
  @IsDefined()
  title?: Civilities;

  @ApiPropertyOptional({ example: 'Benali' })
  @ValidateIf(
    (o) =>
      (o.type === CLIENT_TYPES.INDIVIDUAL && !o.walkIn) ||
      o.lastName !== undefined,
  )
  @IsString()
  @IsDefined({ message: 'lastName is required for particulier clients' })
  lastName?: string;

  @ApiPropertyOptional({ example: 'Youssef' })
  @ValidateIf(
    (o) =>
      (o.type === CLIENT_TYPES.INDIVIDUAL && !o.walkIn) ||
      o.firstName !== undefined,
  )
  @IsString()
  @IsDefined({ message: 'firstName is required for particulier clients' })
  firstName?: string;

  @ApiPropertyOptional({ example: '1990-05-15' })
  @ValidateIf((o) => o.type === CLIENT_TYPES.INDIVIDUAL && !o.walkIn)
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
  idDocumentType?: IdDocumentType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  idDocumentNumber?: string;

  @ApiPropertyOptional({ enum: FamilyLinkValues })
  @IsString()
  @IsEnum(FamilyLinkValues)
  @IsOptional()
  familyLink?: FamilyLink;

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
  @ValidateIf((o) => o.type === CLIENT_TYPES.PROFESSIONAL)
  @IsString()
  @IsDefined()
  companyName?: string;

  @ApiPropertyOptional({ example: '12345678' })
  @ValidateIf((o) => o.type === CLIENT_TYPES.PROFESSIONAL)
  @IsString()
  @IsDefined()
  taxId?: string;

  @ApiPropertyOptional({ example: '001234567000012' })
  @ValidateIf((o) => o.type === CLIENT_TYPES.PROFESSIONAL)
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
  @ValidateIf((o) => o.type === CLIENT_TYPES.PROFESSIONAL)
  @IsBoolean()
  @IsDefined()
  vatExempt?: boolean;
}
