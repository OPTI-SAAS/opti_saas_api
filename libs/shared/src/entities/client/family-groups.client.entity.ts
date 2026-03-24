import { BaseEntity } from '@lib/shared/base';
import { TAddress } from '@lib/shared/types';
import { Column, Entity, OneToMany } from 'typeorm';

import { ClClient } from './clients.client.entity';

@Entity('family_groups')
export class ClFamilyGroup extends BaseEntity {
  @Column({ name: 'name', type: 'varchar' })
  name!: string;

  @Column({ name: 'address', type: 'jsonb', nullable: true })
  address?: TAddress;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes?: string;

  // --- Relationships ---

  @OneToMany(() => ClClient, (client) => client.familyGroup)
  members?: ClClient[];
}
