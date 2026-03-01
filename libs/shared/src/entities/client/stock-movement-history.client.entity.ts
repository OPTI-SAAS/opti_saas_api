import { BaseEntity } from '@lib/shared/base';
import {
  StockMovementType,
  StockRemovalReason,
} from '@lib/shared/enums/client/stock.client.enum';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import type { ClStockEntry } from './stock-entries.client.entity';
import type { ClStockItem } from './stock-items.client.entity';
import { ClWarehouse } from './warehouses.client.entity';

@Entity('stock_movement_history')
@Index('IDX_stock_movement_history_item_created_at', [
  'stockItemId',
  'createdAt',
])
@Index('IDX_stock_movement_history_from_created_at', [
  'fromWarehouseId',
  'createdAt',
])
@Index('IDX_stock_movement_history_to_created_at', [
  'toWarehouseId',
  'createdAt',
])
export class ClStockMovementHistory extends BaseEntity {
  @Column({ name: 'stock_item_id', type: 'uuid' })
  stockItemId!: string;

  @Column({ name: 'movement_type', type: 'varchar' })
  movementType!: StockMovementType;

  @Column({ name: 'from_warehouse_id', type: 'uuid', nullable: true })
  fromWarehouseId?: string;

  @Column({ name: 'to_warehouse_id', type: 'uuid', nullable: true })
  toWarehouseId?: string;

  @Column({ name: 'removal_reason', type: 'varchar', nullable: true })
  removalReason?: StockRemovalReason;

  @Column({ name: 'stock_entry_id', type: 'uuid', nullable: true })
  stockEntryId?: string;

  @Column({ name: 'performed_by_user_id', type: 'uuid' })
  performedByUserId!: string;

  @ManyToOne('ClStockItem', 'movementHistory', {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'stock_item_id' })
  stockItem!: ClStockItem;

  @ManyToOne(() => ClWarehouse, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'from_warehouse_id' })
  fromWarehouse?: ClWarehouse;

  @ManyToOne(() => ClWarehouse, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'to_warehouse_id' })
  toWarehouse?: ClWarehouse;

  @ManyToOne('ClStockEntry', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'stock_entry_id' })
  stockEntry?: ClStockEntry;
}
