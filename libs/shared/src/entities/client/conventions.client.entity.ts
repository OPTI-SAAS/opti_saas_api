import { BaseEntity } from '@lib/shared/base';
import { Check, Column, Entity, JoinColumn, OneToOne, Unique } from 'typeorm';

import { ClClient } from './clients.client.entity';

@Entity('conventions')
@Unique('UQ_conventions_client_id', ['clientId'])
@Check(
  'CHK_conventions_dates',
  'end_date IS NULL OR start_date IS NULL OR end_date > start_date',
)
export class ClConvention extends BaseEntity {
  @Column({ name: 'client_id', type: 'uuid' })
  clientId!: string;

  @Column({ name: 'number', type: 'varchar' })
  number!: string;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate?: string;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate?: string;

  @Column({
    name: 'discount_rate',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  discountRate!: number;

  @Column({
    name: 'credit_limit',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  creditLimit!: number;

  @Column({ name: 'payment_delay', type: 'int', default: 0 })
  paymentDelay!: number;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes?: string;

  // --- Relationships ---

  @OneToOne(() => ClClient, (client) => client.convention, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'client_id' })
  client!: ClClient;
}
