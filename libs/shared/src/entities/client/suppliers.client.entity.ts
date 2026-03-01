import { BaseEntity } from '@lib/shared/base';
import { Column, Entity, OneToMany } from 'typeorm';

import type { ClProductSupplier } from './product-suppliers.client.entity';

@Entity('suppliers')
export class ClSupplier extends BaseEntity {
  @Column({ name: 'name', type: 'varchar', unique: true })
  name!: string;

  @Column({ name: 'description', type: 'varchar', nullable: true })
  description?: string;

  @OneToMany('ClProductSupplier', 'supplier')
  productSuppliers?: ClProductSupplier[];
}
