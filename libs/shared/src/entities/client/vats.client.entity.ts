import { BaseEntity } from '@lib/shared/base';
import { Column, Entity, OneToMany } from 'typeorm';

import { ClProduct } from './products.client.entity';

@Entity('vats')
export class ClVat extends BaseEntity {
  @Column({ name: 'name', type: 'varchar', unique: true })
  name!: string;

  @Column({ name: 'rate', type: 'double precision' })
  rate!: number;

  @OneToMany(() => ClProduct, (product) => product.vat)
  products!: ClProduct[];
}
