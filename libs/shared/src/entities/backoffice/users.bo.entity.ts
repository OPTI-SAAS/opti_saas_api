import { bycryptHashPassword, comparePassword } from '@lib/shared/helpers';
import { Exclude } from 'class-transformer';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';

import { BaseEntity } from '../../base';
import { BoTenantGroup } from './tenant-groups.bo.entity';
import { BoUserTenant } from './user-tenants.bo.entity';

@Entity('users', { schema: 'backoffice' })
export class BoUser extends BaseEntity {
  @Column({
    type: 'varchar',
    name: 'first_name',
    length: 255,
  })
  firstName!: string;

  @Column({
    type: 'varchar',
    name: 'last_name',
    length: 255,
  })
  lastName!: string;

  @Column({ unique: true, type: 'varchar', length: 255 })
  email!: string;

  @Column({
    type: 'varchar',
    name: 'password',
    length: 255,
  })
  @Exclude()
  private _password!: string;

  @Column({
    type: 'varchar',
    name: 'refresh_token',
    length: 500,
    nullable: true,
  })
  @Exclude()
  refreshToken?: string;

  // reverse relation for the group where he's owner
  @OneToOne(() => BoTenantGroup, (group) => group.owner)
  ownedTenantGroup!: BoTenantGroup;

  // memberships to specific tenants inside his group
  @OneToMany(() => BoUserTenant, (ut) => ut.user)
  tenantMemberships!: BoUserTenant[];

  @Column({
    name: 'tenant_group_id',
    type: 'uuid',
    nullable: true,
    unique: false,
  })
  tenantGroupId!: string;

  @ManyToOne(() => BoTenantGroup, { nullable: true })
  @JoinColumn({ name: 'tenant_group_id' })
  tenantGroup!: BoTenantGroup;

  constructor(data: Partial<BoUser> = {}) {
    super();
    Object.assign(this, data);
  }

  get password(): string {
    return this._password;
  }

  async setPassword(value: string): Promise<void> {
    this._password = await bycryptHashPassword(value);
  }

  async checkPassword(plainPassword: string): Promise<boolean> {
    return await comparePassword(plainPassword, this._password);
  }
}
