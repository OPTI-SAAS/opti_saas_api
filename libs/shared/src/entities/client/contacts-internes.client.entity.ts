import { BaseEntity } from '@lib/shared/base';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { ClClient } from './clients.client.entity';

@Entity('contacts_internes')
@Index('IDX_contacts_internes_client', ['clientId'])
export class ClContactInterne extends BaseEntity {
  @Column({ name: 'client_id', type: 'uuid' })
  clientId!: string;

  @Column({ name: 'last_name', type: 'varchar' })
  lastName!: string;

  @Column({ name: 'first_name', type: 'varchar' })
  firstName!: string;

  @Column({ name: 'position', type: 'varchar' })
  position!: string;

  @Column({ name: 'phone', type: 'varchar' })
  phone!: string;

  @Column({ name: 'email', type: 'varchar' })
  email!: string;

  @Column({ name: 'is_principal', type: 'boolean', default: false })
  isPrincipal!: boolean;

  // --- Relationships ---

  @ManyToOne(() => ClClient, (client) => client.contactsInternes, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'client_id' })
  client!: ClClient;
}
