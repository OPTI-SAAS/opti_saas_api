import { BaseEntity } from '@lib/shared/base';
import { WarehouseType } from '@lib/shared/enums/client/warehouse.client.enum';
import { TAddress } from '@lib/shared/types';
import { Column, Entity } from 'typeorm';

@Entity('warehouses')
export class ClWarehouse extends BaseEntity {
  @Column({ name: 'name', type: 'varchar' })
  name!: string;

  @Column({ name: 'capacity', type: 'int', nullable: true })
  capacity?: number;

  @Column({ name: 'address', type: 'jsonb', nullable: true })
  address?: TAddress;

  @Column({ name: 'type', type: 'varchar' })
  _type!: WarehouseType;

  @Column({ name: 'active', type: 'boolean', default: true })
  active!: boolean;
}
