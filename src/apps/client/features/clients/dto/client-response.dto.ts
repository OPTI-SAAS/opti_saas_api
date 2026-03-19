import {
  type Civilities,
  CivilitiesValues,
  CLIENT_TYPES,
  type ClientType,
  type FamilyLink,
  FamilyLinkValues,
  type IdDocumentType,
  IdDocumentTypeValues,
} from '@lib/shared/enums/client/client.client.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ── Shared base ──

class ClientBaseResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  type!: ClientType;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  address?: string;

  @ApiProperty()
  active!: boolean;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

// ── Pagination meta ──

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 100 })
  total!: number;

  @ApiProperty({ example: 10 })
  pages!: number;

  @ApiProperty({ example: false })
  hasPrev!: boolean;

  @ApiProperty({ example: true })
  hasNext!: boolean;
}

// ── Paginated clients ──

export class PaginatedClientsResponseDto {
  @ApiProperty({
    type: 'array',
    items: {
      oneOf: [
        { $ref: '#/components/schemas/ClientParticulierResponseDto' },
        { $ref: '#/components/schemas/ClientProfessionnelResponseDto' },
      ],
    },
  })
  data!: (ClientParticulierResponseDto | ClientProfessionnelResponseDto)[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}

// ── Family group response ──

export class FamilyGroupMemberResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional()
  firstName?: string;

  @ApiPropertyOptional()
  lastName?: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional({ enum: FamilyLinkValues })
  familyLink?: FamilyLink;
}

export class FamilyGroupResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Famille Benali' })
  nom!: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  address?: Record<string, unknown>;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty({ type: [FamilyGroupMemberResponseDto] })
  members!: FamilyGroupMemberResponseDto[];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class PaginatedFamilyGroupsResponseDto {
  @ApiProperty({ type: [FamilyGroupResponseDto] })
  data!: FamilyGroupResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}

// ── Convention response ──

export class ConventionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  clientId!: string;

  @ApiProperty({ example: 'CONV-2026-001' })
  numero!: string;

  @ApiPropertyOptional({ example: '2026-01-01' })
  dateDebut?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  dateFin?: string;

  @ApiProperty({ example: 10.0 })
  tauxRemise!: number;

  @ApiProperty({ example: 50000 })
  plafondCredit!: number;

  @ApiProperty({ example: 30 })
  delaiPaiement!: number;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

// ── Contact interne response ──

export class ContactInterneResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  clientId!: string;

  @ApiProperty({ example: 'Alami' })
  nom!: string;

  @ApiProperty({ example: 'Sara' })
  prenom!: string;

  @ApiProperty({ example: 'Responsable RH' })
  fonction!: string;

  @ApiProperty({ example: '0612345678' })
  telephone!: string;

  @ApiProperty({ example: 's.alami@company.ma' })
  email!: string;

  @ApiProperty({ example: true })
  principal!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

// ── Delete message response ──

export class MessageResponseDto {
  @ApiProperty({ example: 'Resource deleted successfully' })
  message!: string;
}

// ── Particulier ──

export class ClientParticulierResponseDto extends ClientBaseResponseDto {
  @ApiProperty({ enum: [CLIENT_TYPES.PARTICULIER], example: 'particulier' })
  type!: typeof CLIENT_TYPES.PARTICULIER;

  @ApiProperty({
    example: false,
    description: 'true for walk-in (passage) clients',
  })
  passager?: boolean;

  @ApiProperty({ example: false, description: 'true if client is a minor' })
  isMinor?: boolean;

  @ApiPropertyOptional({ enum: CivilitiesValues, example: 'Mr' })
  title?: Civilities;

  @ApiPropertyOptional({ example: 'Benali' })
  lastName?: string;

  @ApiPropertyOptional({ example: 'Youssef' })
  firstName?: string;

  @ApiPropertyOptional({
    example: '1990-05-15',
    description: 'Date of birth (YYYY-MM-DD)',
  })
  birthDate?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Sponsor/referral client ID',
  })
  sponsorId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tutor/legal guardian client ID',
  })
  tutorId?: string;

  @ApiPropertyOptional({ example: 'Fatima Benali' })
  spouseName?: string;

  @ApiPropertyOptional({ enum: IdDocumentTypeValues, example: 'CIN' })
  idDocumentType?: IdDocumentType;

  @ApiPropertyOptional({ example: 'AB123456' })
  idDocumentNumber?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Family group ID' })
  familyGroupId?: string;

  @ApiPropertyOptional({ type: () => FamilyGroupResponseDto })
  familyGroup?: FamilyGroupResponseDto;

  @ApiPropertyOptional({ enum: FamilyLinkValues, example: 'principal' })
  familyLink?: FamilyLink;

  @ApiPropertyOptional({ example: true })
  isOpticalBeneficiary?: boolean;

  @ApiPropertyOptional({ example: true })
  isFinancialResponsible?: boolean;

  @ApiPropertyOptional({ example: false })
  hasSharedMutual?: boolean;

  @ApiPropertyOptional({ example: true })
  hasSharedAddress?: boolean;

  @ApiPropertyOptional({ example: true })
  hasSocialCoverage?: boolean;

  @ApiPropertyOptional({ example: 'AMO' })
  coverageType?: string;

  @ApiPropertyOptional({ example: 'MBR-123456' })
  membershipNumber?: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    example: {
      currentlyWearing: 'glasses',
      hasDryness: true,
      hasEyeTrauma: false,
      screenTimeOver4h: true,
    },
  })
  medicalRecord?: Record<string, unknown>;
}

// ── Professionnel ──

export class ClientProfessionnelResponseDto extends ClientBaseResponseDto {
  @ApiProperty({ enum: [CLIENT_TYPES.PROFESSIONNEL], example: 'professionnel' })
  type!: typeof CLIENT_TYPES.PROFESSIONNEL;

  @ApiProperty({ example: 'OptikVision SARL' })
  companyName?: string;

  @ApiProperty({ example: '12345678' })
  taxId?: string;

  @ApiProperty({
    example: '001234567000012',
    description: "Identifiant Commun de l'Entreprise",
  })
  ice?: string;

  @ApiPropertyOptional({ example: 'RC-123456' })
  commercialRegister?: string;

  @ApiPropertyOptional({ example: 'TP-789012' })
  tradeLicense?: string;

  @ApiProperty({ example: false, description: 'VAT exemption status' })
  vatExempt?: boolean;

  @ApiPropertyOptional({
    type: () => ConventionResponseDto,
    nullable: true,
    description: 'Convention (discount agreement) if any',
  })
  convention?: ConventionResponseDto | null;

  @ApiPropertyOptional({
    type: () => [ContactInterneResponseDto],
    description: 'Internal business contacts',
  })
  contactsInternes?: ContactInterneResponseDto[];
}
