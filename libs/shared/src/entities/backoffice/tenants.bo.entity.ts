import { BaseEntity } from '@lib/shared/base';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { BoTenantGroup } from './tenant-groups.bo.entity';
import { BoUserTenant } from './user-tenants.bo.entity';

@Entity('tenants', { schema: 'backoffice' })
export class BoTenant extends BaseEntity {
  @ManyToOne(() => BoTenantGroup, (g) => g.tenants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenant_group_id' })
  tenantGroup!: BoTenantGroup;

  @OneToMany(() => BoUserTenant, (ut) => ut.tenant)
  userMemberships!: BoUserTenant[];

  @Column({ name: 'db_schema', unique: true, nullable: true })
  dbSchema!: string;

  @Column({ name: 'name', unique: true })
  name!: string;
}
