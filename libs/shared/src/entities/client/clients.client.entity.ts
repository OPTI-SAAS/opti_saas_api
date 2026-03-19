import { BaseEntity } from '@lib/shared/base';
import type {
  Civilities,
  ClientType,
  FamilyLink,
  IdDocumentType,
} from '@lib/shared/enums/client/client.client.enum';
import { CLIENT_GROUPS } from '@lib/shared/enums/client/client.client.enum';
import { Exclude, Expose } from 'class-transformer';
import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  Unique,
} from 'typeorm';

import type { ClContactInterne } from './contacts-internes.client.entity';
import type { ClConvention } from './conventions.client.entity';
import type { ClFamilyGroup } from './family-groups.client.entity';

@Exclude()
@Entity('clients')
@Check('CHK_clients_type', "type IN ('particulier', 'professionnel')")
@Check(
  'CHK_clients_family_link',
  "family_link IS NULL OR family_link IN ('principal', 'conjoint', 'tutor', 'parent', 'children')",
)
@Index('IDX_clients_type_active', ['type', 'active'])
@Index('IDX_clients_last_name', ['lastName'])
@Index('IDX_clients_company_name', ['companyName'])
@Index('IDX_clients_family_group', ['familyGroupId'])
@Unique('UQ_clients_ice', ['ice'])
export class ClClient extends BaseEntity {
  // --- Shared base fields (always exposed) ---

  @Expose()
  override id!: string;

  @Expose()
  override createdAt!: Date;

  @Expose()
  override updatedAt!: Date;

  @Expose()
  @Column({ name: 'type', type: 'varchar' })
  type!: ClientType;

  @Expose()
  @Column({ name: 'phone', type: 'varchar', nullable: true })
  phone?: string;

  @Expose()
  @Column({ name: 'email', type: 'varchar', nullable: true })
  email?: string;

  @Expose()
  @Column({ name: 'city', type: 'varchar', nullable: true })
  city?: string;

  @Expose()
  @Column({ name: 'address', type: 'varchar', nullable: true })
  address?: string;

  @Expose()
  @Column({ name: 'active', type: 'boolean', default: true })
  active!: boolean;

  // --- Particulier-specific fields ---

  @Expose({ groups: [CLIENT_GROUPS.PARTICULIER, CLIENT_GROUPS.PASSAGE] })
  @Column({ name: 'passager', type: 'boolean', default: false, nullable: true })
  passager?: boolean;

  @Expose({ groups: [CLIENT_GROUPS.PARTICULIER] })
  @Column({ name: 'is_minor', type: 'boolean', default: false, nullable: true })
  isMinor?: boolean;

  @Expose({ groups: [CLIENT_GROUPS.PARTICULIER] })
  @Column({ name: 'title', type: 'varchar', nullable: true })
  title?: Civilities;

  @Expose({ groups: [CLIENT_GROUPS.PARTICULIER, CLIENT_GROUPS.PASSAGE] })
  @Column({ name: 'last_name', type: 'varchar', nullable: true })
  lastName?: string;

  @Expose({ groups: [CLIENT_GROUPS.PARTICULIER, CLIENT_GROUPS.PASSAGE] })
  @Column({ name: 'first_name', type: 'varchar', nullable: true })
  firstName?: string;

  @Expose({ groups: [CLIENT_GROUPS.PARTICULIER] })
  @Column({ name: 'birth_date', type: 'date', nullable: true })
  birthDate?: string;

  @Expose({ groups: [CLIENT_GROUPS.PARTICULIER] })
  @Column({ name: 'sponsor_id', type: 'uuid', nullable: true })
  sponsorId?: string;

  @Expose({ groups: [CLIENT_GROUPS.PARTICULIER] })
  @Column({ name: 'tutor_id', type: 'uuid', nullable: true })
  tutorId?: string;

  @Expose({ groups: [CLIENT_GROUPS.PARTICULIER] })
  @Column({ name: 'spouse_name', type: 'varchar', nullable: true })
  spouseName?: string;

  @Expose({ groups: [CLIENT_GROUPS.PARTICULIER] })
  @Column({ name: 'id_document_type', type: 'varchar', nullable: true })
  idDocumentType?: IdDocumentType;

  @Expose({ groups: [CLIENT_GROUPS.PARTICULIER] })
  @Column({ name: 'id_document_number', type: 'varchar', nullable: true })
  idDocumentNumber?: string;

  @Expose({ groups: [CLIENT_GROUPS.PARTICULIER] })
  @Column({ name: 'family_group_id', type: 'uuid', nullable: true })
  familyGroupId?: string;

  @Expose({ groups: [CLIENT_GROUPS.PARTICULIER] })
  @Column({ name: 'family_link', type: 'varchar', nullable: true })
  familyLink?: FamilyLink;

  @Expose({ groups: [CLIENT_GROUPS.PARTICULIER] })
  @Column({ name: 'is_optical_beneficiary', type: 'boolean', nullable: true })
  isOpticalBeneficiary?: boolean;

  @Expose({ groups: [CLIENT_GROUPS.PARTICULIER] })
  @Column({
    name: 'is_financial_responsible',
    type: 'boolean',
    nullable: true,
  })
  isFinancialResponsible?: boolean;

  @Expose({ groups: [CLIENT_GROUPS.PARTICULIER] })
  @Column({ name: 'has_shared_mutual', type: 'boolean', nullable: true })
  hasSharedMutual?: boolean;

  @Expose({ groups: [CLIENT_GROUPS.PARTICULIER] })
  @Column({ name: 'has_shared_address', type: 'boolean', nullable: true })
  hasSharedAddress?: boolean;

  @Expose({ groups: [CLIENT_GROUPS.PARTICULIER] })
  @Column({ name: 'has_social_coverage', type: 'boolean', nullable: true })
  hasSocialCoverage?: boolean;

  @Expose({ groups: [CLIENT_GROUPS.PARTICULIER] })
  @Column({ name: 'coverage_type', type: 'varchar', nullable: true })
  coverageType?: string;

  @Expose({ groups: [CLIENT_GROUPS.PARTICULIER] })
  @Column({ name: 'membership_number', type: 'varchar', nullable: true })
  membershipNumber?: string;

  @Expose({ groups: [CLIENT_GROUPS.PARTICULIER] })
  @Column({
    name: 'medical_record',
    type: 'jsonb',
    nullable: false,
    default: () => "'{}'",
  })
  medicalRecord!: Record<string, unknown>;

  @Expose({ groups: [CLIENT_GROUPS.PARTICULIER] })
  @Column({ name: 'notes', type: 'text', nullable: true })
  notes?: string;

  // --- Professionnel-specific fields ---

  @Expose({ groups: [CLIENT_GROUPS.PROFESSIONNEL] })
  @Column({ name: 'company_name', type: 'varchar', nullable: true })
  companyName?: string;

  @Expose({ groups: [CLIENT_GROUPS.PROFESSIONNEL] })
  @Column({ name: 'tax_id', type: 'varchar', nullable: true })
  taxId?: string;

  @Expose({ groups: [CLIENT_GROUPS.PROFESSIONNEL] })
  @Column({ name: 'ice', type: 'varchar', nullable: true })
  ice?: string;

  @Expose({ groups: [CLIENT_GROUPS.PROFESSIONNEL] })
  @Column({ name: 'commercial_register', type: 'varchar', nullable: true })
  commercialRegister?: string;

  @Expose({ groups: [CLIENT_GROUPS.PROFESSIONNEL] })
  @Column({ name: 'trade_license', type: 'varchar', nullable: true })
  tradeLicense?: string;

  @Expose({ groups: [CLIENT_GROUPS.PROFESSIONNEL] })
  @Column({ name: 'vat_exempt', type: 'boolean', nullable: true })
  vatExempt?: boolean;

  // --- Relationships ---

  @Expose({ groups: [CLIENT_GROUPS.PARTICULIER] })
  @ManyToOne(() => ClClient, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sponsor_id' })
  sponsor?: ClClient;

  @Expose({ groups: [CLIENT_GROUPS.PARTICULIER] })
  @ManyToOne(() => ClClient, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'tutor_id' })
  tutor?: ClClient;

  @Expose({ groups: [CLIENT_GROUPS.PARTICULIER] })
  @ManyToOne('ClFamilyGroup', 'members', {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'family_group_id' })
  familyGroup?: ClFamilyGroup;

  @Expose({ groups: [CLIENT_GROUPS.PROFESSIONNEL] })
  @OneToOne('ClConvention', 'client')
  convention?: ClConvention;

  @Expose({ groups: [CLIENT_GROUPS.PROFESSIONNEL] })
  @OneToMany('ClContactInterne', 'client')
  contactsInternes?: ClContactInterne[];
}
