import { BaseEntity } from '@lib/shared/base';
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

@Entity('clients')
@Check(
  'CHK_clients_type',
  "type IN ('particulier', 'passage', 'professionnel')",
)
@Index('IDX_clients_type_active', ['type', 'active'])
@Index('IDX_clients_last_name', ['lastName'])
@Index('IDX_clients_company_name', ['companyName'])
@Index('IDX_clients_family_group', ['familyGroupId'])
@Unique('UQ_clients_ice', ['ice'])
export class ClClient extends BaseEntity {
  // --- Shared base fields ---

  @Column({ name: 'type', type: 'varchar' })
  type!: string;

  @Column({ name: 'phone', type: 'varchar', nullable: true })
  phone?: string;

  @Column({ name: 'email', type: 'varchar', nullable: true })
  email?: string;

  @Column({ name: 'city', type: 'varchar', nullable: true })
  city?: string;

  @Column({ name: 'address', type: 'varchar', nullable: true })
  address?: string;

  @Column({ name: 'active', type: 'boolean', default: true })
  active!: boolean;

  // --- Particulier-specific fields ---

  @Column({ name: 'title', type: 'varchar', nullable: true })
  title?: string;

  @Column({ name: 'last_name', type: 'varchar', nullable: true })
  lastName?: string;

  @Column({ name: 'first_name', type: 'varchar', nullable: true })
  firstName?: string;

  @Column({ name: 'birth_date', type: 'date', nullable: true })
  birthDate?: string;

  @Column({ name: 'sponsor_id', type: 'uuid', nullable: true })
  sponsorId?: string;

  @Column({ name: 'spouse_name', type: 'varchar', nullable: true })
  spouseName?: string;

  @Column({ name: 'id_document_type', type: 'varchar', nullable: true })
  idDocumentType?: string;

  @Column({ name: 'id_document_number', type: 'varchar', nullable: true })
  idDocumentNumber?: string;

  @Column({ name: 'family_group_id', type: 'uuid', nullable: true })
  familyGroupId?: string;

  @Column({ name: 'family_link', type: 'varchar', nullable: true })
  familyLink?: string;

  @Column({ name: 'is_optical_beneficiary', type: 'boolean', nullable: true })
  isOpticalBeneficiary?: boolean;

  @Column({
    name: 'is_financial_responsible',
    type: 'boolean',
    nullable: true,
  })
  isFinancialResponsible?: boolean;

  @Column({ name: 'has_shared_mutual', type: 'boolean', nullable: true })
  hasSharedMutual?: boolean;

  @Column({ name: 'has_shared_address', type: 'boolean', nullable: true })
  hasSharedAddress?: boolean;

  @Column({ name: 'has_social_coverage', type: 'boolean', nullable: true })
  hasSocialCoverage?: boolean;

  @Column({ name: 'coverage_type', type: 'varchar', nullable: true })
  coverageType?: string;

  @Column({ name: 'membership_number', type: 'varchar', nullable: true })
  membershipNumber?: string;

  @Column({
    name: 'medical_record',
    type: 'jsonb',
    nullable: false,
    default: () => "'{}'",
  })
  medicalRecord!: Record<string, unknown>;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes?: string;

  // --- Professionnel-specific fields ---

  @Column({ name: 'company_name', type: 'varchar', nullable: true })
  companyName?: string;

  @Column({ name: 'tax_id', type: 'varchar', nullable: true })
  taxId?: string;

  @Column({ name: 'ice', type: 'varchar', nullable: true })
  ice?: string;

  @Column({ name: 'commercial_register', type: 'varchar', nullable: true })
  commercialRegister?: string;

  @Column({ name: 'trade_license', type: 'varchar', nullable: true })
  tradeLicense?: string;

  @Column({ name: 'vat_exempt', type: 'boolean', nullable: true })
  vatExempt?: boolean;

  // --- Relationships ---

  @ManyToOne(() => ClClient, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sponsor_id' })
  sponsor?: ClClient;

  @ManyToOne('ClFamilyGroup', 'members', {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'family_group_id' })
  familyGroup?: ClFamilyGroup;

  @OneToOne('ClConvention', 'client')
  convention?: ClConvention;

  @OneToMany('ClContactInterne', 'client')
  contactsInternes?: ClContactInterne[];
}
