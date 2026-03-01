import { BaseEntity } from '@lib/shared/base';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';

import { ClProduct } from './products.client.entity';
import { ClSupplier } from './suppliers.client.entity';

@Entity('product_suppliers')
@Unique('UQ_product_suppliers_product_supplier', ['productId', 'supplierId'])
export class ClProductSupplier extends BaseEntity {
  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @Column({ name: 'supplier_id', type: 'uuid' })
  supplierId!: string;

  // supplier product reference code for the product
  @Column({ name: 'product_referance_code', type: 'varchar' })
  productReferanceCode!: string;

  @ManyToOne(() => ClProduct, (product) => product.productSuppliers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product!: ClProduct;

  @ManyToOne(() => ClSupplier, (supplier) => supplier.productSuppliers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'supplier_id' })
  supplier!: ClSupplier;
}
