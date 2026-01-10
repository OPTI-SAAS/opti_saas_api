import { BaseEntity } from '@lib/shared/base';
import { Exclude } from 'class-transformer';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { BoRole } from '../backoffice/roles.bo.entity';

@Entity('roles')
export class ClRole extends BaseEntity {
  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  @Exclude()
  parentId?: string;

  @Column({ name: 'name', type: 'varchar', unique: true })
  name!: string;

  @ManyToOne(() => BoRole, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent?: BoRole;
}
