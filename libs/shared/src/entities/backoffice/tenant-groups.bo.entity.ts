import { BaseEntity } from '@lib/shared/base';
import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';

import { BoTenant } from './tenants.bo.entity';
import { BoUser } from './users.bo.entity';

@Entity('tenant_groups', { schema: 'backoffice' })
export class BoTenantGroup extends BaseEntity {
  // one owner per group
  @Column({ name: 'owner_user_id', unique: true })
  ownerUserId!: string;

  @OneToOne(() => BoUser, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'owner_user_id' })
  owner!: BoUser;

  // many tenants
  @OneToMany(() => BoTenant, (t) => t.tenantGroup)
  tenants!: BoTenant[];
}
