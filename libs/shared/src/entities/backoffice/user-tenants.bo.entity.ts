import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';

import { BaseEntity } from '../../base';
import { BoTenant } from './tenants.bo.entity';
import { BoUser } from './users.bo.entity';

@Entity('user_tenants', { schema: 'backoffice' })
@Unique(['userId', 'tenantId'])
export class BoUserTenant extends BaseEntity {
  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @ManyToOne(() => BoUser, (user) => user.tenantMemberships, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: BoUser;

  @ManyToOne(() => BoTenant, (tenant) => tenant.userMemberships, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: BoTenant;
}
