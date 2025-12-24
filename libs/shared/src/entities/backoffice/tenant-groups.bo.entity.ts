import { BaseEntity } from '@lib/shared/base';
import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';

import { BoOwner } from './owners.bo.entity';
import { BoTenant } from './tenants.bo.entity';

@Entity('tenant_groups', { schema: 'backoffice' })
export class BoTenantGroup extends BaseEntity {
  // one owner per group
  @Column({ name: 'owner_id', unique: true })
  ownerId!: string;

  @OneToOne(() => BoOwner, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'owner_id' })
  owner!: BoOwner;

  // many tenants
  @OneToMany(() => BoTenant, (t) => t.tenantGroup)
  tenants!: BoTenant[];
}
