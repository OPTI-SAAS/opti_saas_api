import { BaseEntity } from '@lib/shared/base';
import { ResourceAuthorizations } from '@optisaas/opti-saas-lib';
import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';

import { ClRole } from './roles.client.entity';

@Entity('role_authorization')
@Unique(['roleId', 'authorization', 'coefficient'])
@Index(['roleId', 'deletedAt', 'coefficient'])
export class ClAuthorization extends BaseEntity {
  @Column({ name: 'role_id', type: 'uuid' })
  roleId!: string;

  @ManyToOne(() => ClRole, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'role_id' })
  role!: ClRole;

  @Column({ name: 'authorization', type: 'varchar' })
  authorization!: ResourceAuthorizations;

  @Column({ name: 'coefficient', type: 'smallint', nullable: false })
  coefficient!: 0 | -1;
}
