import { BaseEntity } from '@lib/shared/base';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { ClClient } from './clients.client.entity';

@Entity('contacts_internes')
@Index('IDX_contacts_internes_client', ['clientId'])
export class ClContactInterne extends BaseEntity {
  @Column({ name: 'client_id', type: 'uuid' })
  clientId!: string;

  @Column({ name: 'nom', type: 'varchar' })
  nom!: string;

  @Column({ name: 'prenom', type: 'varchar' })
  prenom!: string;

  @Column({ name: 'fonction', type: 'varchar' })
  fonction!: string;

  @Column({ name: 'telephone', type: 'varchar' })
  telephone!: string;

  @Column({ name: 'email', type: 'varchar' })
  email!: string;

  @Column({ name: 'principal', type: 'boolean', default: false })
  principal!: boolean;

  // --- Relationships ---

  @ManyToOne(() => ClClient, (client) => client.contactsInternes, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'client_id' })
  client!: ClClient;
}
