import { BaseEntity } from '@lib/shared/base';
import { Exclude, Expose } from 'class-transformer';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { BoTenantGroup } from './tenant-groups.bo.entity';
import { BoUserTenant } from './user-tenants.bo.entity';

@Entity('tenants', { schema: 'backoffice' })
@Exclude()
export class BoTenant extends BaseEntity {
  @Column({ name: 'tenant_group_id', type: 'uuid' })
  tenantGroupId!: string;

  @ManyToOne(() => BoTenantGroup, (g) => g.tenants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenant_group_id' })
  tenantGroup!: BoTenantGroup;

  @OneToMany(() => BoUserTenant, (ut) => ut.tenant)
  userMemberships!: BoUserTenant[];

  @Column({ name: 'db_schema', type: 'varchar', unique: true, nullable: true })
  dbSchema!: string;

  @Column({ name: 'name', type: 'varchar', unique: true })
  @Expose()
  name!: string;
}
