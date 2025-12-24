import { bycryptHashPassword, comparePassword } from '@lib/shared/helpers';
import { Exclude } from 'class-transformer';
import { Column, Entity, OneToOne } from 'typeorm';

import { BaseEntity } from '../../base';
import { BoTenantGroup } from './tenant-groups.bo.entity';

@Entity('owners', { schema: 'backoffice' })
export class BoOwner extends BaseEntity {
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

  // reverse relation for the group where he's owner
  @OneToOne(() => BoTenantGroup, (group) => group.owner)
  ownedTenantGroup!: BoTenantGroup;

  constructor(data: Partial<BoOwner> = {}) {
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
