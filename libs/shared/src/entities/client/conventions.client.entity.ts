import { BaseEntity } from '@lib/shared/base';
import { Check, Column, Entity, JoinColumn, OneToOne, Unique } from 'typeorm';

import { ClClient } from './clients.client.entity';

@Entity('conventions')
@Unique('UQ_conventions_client_id', ['clientId'])
@Check(
  'CHK_conventions_dates',
  'date_fin IS NULL OR date_debut IS NULL OR date_fin > date_debut',
)
export class ClConvention extends BaseEntity {
  @Column({ name: 'client_id', type: 'uuid' })
  clientId!: string;

  @Column({ name: 'numero', type: 'varchar' })
  numero!: string;

  @Column({ name: 'date_debut', type: 'date', nullable: true })
  dateDebut?: string;

  @Column({ name: 'date_fin', type: 'date', nullable: true })
  dateFin?: string;

  @Column({
    name: 'taux_remise',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  tauxRemise!: number;

  @Column({
    name: 'plafond_credit',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  plafondCredit!: number;

  @Column({ name: 'delai_paiement', type: 'int', default: 0 })
  delaiPaiement!: number;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes?: string;

  // --- Relationships ---

  @OneToOne(() => ClClient, (client) => client.convention, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'client_id' })
  client!: ClClient;
}
