import { BaseEntity } from '@lib/shared/base';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { BoTenant } from './tenants.bo.entity';
import { BoUser } from './users.bo.entity';

@Entity('tenant_groups', { schema: 'backoffice' })
export class BoTenantGroup extends BaseEntity {
  // one owner per group
  @Column({ name: 'owner_user_id', unique: true })
  ownerUserId!: string;

  @ManyToOne(() => BoUser, (u) => u.tenantGroup, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'owner_user_id' })
  owner!: BoUser;

  // all users (owner + staff) in this group
  @OneToMany(() => BoUser, (user) => user.tenantGroup)
  users!: BoUser[];

  // many tenants
  @OneToMany(() => BoTenant, (t) => t.tenantGroup)
  tenants!: BoTenant[];
}
