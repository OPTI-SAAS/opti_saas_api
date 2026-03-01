import { BaseEntity } from '@lib/shared/base';
import { Check, Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';

import { ClProduct } from './products.client.entity';
import type { ClStockEntry } from './stock-entries.client.entity';
import { ClWarehouse } from './warehouses.client.entity';

@Entity('stock_entry_lines')
@Unique('UQ_stock_entry_lines_entry_product_warehouse', [
  'stockEntryId',
  'productId',
  'warehouseId',
])
@Check('CHK_stock_entry_lines_quantity_positive', 'quantity > 0')
export class ClStockEntryLine extends BaseEntity {
  @Column({ name: 'stock_entry_id', type: 'uuid' })
  stockEntryId!: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @Column({ name: 'warehouse_id', type: 'uuid' })
  warehouseId!: string;

  @Column({ name: 'quantity', type: 'int' })
  quantity!: number;

  @ManyToOne('ClStockEntry', 'lines', { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'stock_entry_id' })
  stockEntry!: ClStockEntry;

  @ManyToOne(() => ClProduct, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product!: ClProduct;

  @ManyToOne(() => ClWarehouse, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse!: ClWarehouse;
}
