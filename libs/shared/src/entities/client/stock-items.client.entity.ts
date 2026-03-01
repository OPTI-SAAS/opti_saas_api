import { BaseEntity } from '@lib/shared/base';
import {
  STOCK_ITEM_STATUSES,
  StockItemStatus,
} from '@lib/shared/enums/client/stock.client.enum';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';

import { ClProduct } from './products.client.entity';
import type { ClStockEntry } from './stock-entries.client.entity';
import type { ClStockMovementHistory } from './stock-movement-history.client.entity';
import { ClWarehouse } from './warehouses.client.entity';

@Entity('stock_items')
@Index('IDX_stock_items_warehouse_status', ['warehouseId', 'status'])
@Index('IDX_stock_items_product_status', ['productId', 'status'])
export class ClStockItem extends BaseEntity {
  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @Column({ name: 'warehouse_id', type: 'uuid' })
  warehouseId!: string;

  @Column({ name: 'stock_entry_id', type: 'uuid' })
  stockEntryId!: string;

  @Column({
    name: 'status',
    type: 'varchar',
    default: STOCK_ITEM_STATUSES.ACTIVE,
  })
  status!: StockItemStatus;

  @ManyToOne(() => ClProduct, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product!: ClProduct;

  @ManyToOne(() => ClWarehouse, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse!: ClWarehouse;

  @ManyToOne('ClStockEntry', 'stockItems', {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'stock_entry_id' })
  stockEntry!: ClStockEntry;

  @OneToMany('ClStockMovementHistory', 'stockItem')
  movementHistory?: ClStockMovementHistory[];
}
