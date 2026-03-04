import { BaseEntity } from '@lib/shared/base';
import { Column, Entity, OneToMany } from 'typeorm';

import type { ClClient } from './clients.client.entity';

@Entity('family_groups')
export class ClFamilyGroup extends BaseEntity {
  @Column({ name: 'nom', type: 'varchar' })
  nom!: string;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes?: string;

  // --- Relationships ---

  @OneToMany('ClClient', 'familyGroup')
  members?: ClClient[];
}
