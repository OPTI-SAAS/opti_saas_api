import { bycryptHashPassword, comparePassword } from '@lib/shared/helpers';
import { Exclude, Expose } from 'class-transformer';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { BaseEntity } from '../../base';
import {
  BoUserStatus,
  TBoUserStatus,
} from '../../enums/backoffice/users.bo.enum';
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
    name: 'mobile_phone',
    length: 20,
    nullable: true,
  })
  mobilePhone?: string;

  @Column({
    type: 'varchar',
    name: 'mobile_country_code',
    length: 10,
    nullable: true,
  })
  mobileCountryCode?: string;

  @Column({
    type: 'varchar',
    name: 'agreement',
    length: 255,
    nullable: true,
  })
  agreement?: string;

  @Column({
    type: 'varchar',
    name: 'status',
    length: 30,
    default: "'active'",
  })
  @Exclude()
  status!: TBoUserStatus;

  @Expose()
  get active(): boolean {
    return this.status === BoUserStatus.active;
  }

  @Column({
    type: 'timestamp with time zone',
    name: 'last_login_at',
    nullable: true,
  })
  lastLoginAt?: Date;

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

  // memberships to specific tenants inside his group
  @OneToMany(() => BoUserTenant, (ut) => ut.user)
  tenantMemberships!: BoUserTenant[];

  @Column({
    name: 'tenant_group_id',
    type: 'uuid',
    nullable: true,
    unique: false,
  })
  @Exclude()
  tenantGroupId!: string;

  @ManyToOne(() => BoTenantGroup, { nullable: true })
  @JoinColumn({ name: 'tenant_group_id' })
  @Exclude()
  tenantGroup!: BoTenantGroup;

  constructor(data: Partial<BoUser> = {}) {
    super();
    Object.assign(this, data);
    if (!this.status) {
      this.status = BoUserStatus.active;
    }
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
