import { BaseEntity } from '@lib/shared/base';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { ClFile } from './files.client.entity';
import type { ClStockEntryLine } from './stock-entry-lines.client.entity';
import type { ClStockItem } from './stock-items.client.entity';
import { ClSupplier } from './suppliers.client.entity';

@Entity('stock_entries')
export class ClStockEntry extends BaseEntity {
  @Column({ name: 'supplier_id', type: 'uuid' })
  supplierId!: string;

  @Column({ name: 'file_id', type: 'uuid', nullable: true })
  fileId?: string;

  @Column({ name: 'created_by_user_id', type: 'uuid' })
  createdByUserId!: string;

  @ManyToOne(() => ClSupplier, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'supplier_id' })
  supplier!: ClSupplier;

  @ManyToOne(() => ClFile, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'file_id' })
  file?: ClFile;

  @OneToMany('ClStockEntryLine', 'stockEntry')
  lines?: ClStockEntryLine[];

  @OneToMany('ClStockItem', 'stockEntry')
  stockItems?: ClStockItem[];
}
