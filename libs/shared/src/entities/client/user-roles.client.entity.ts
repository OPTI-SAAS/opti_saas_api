import { BaseEntity } from '@lib/shared/base';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  Unique,
} from 'typeorm';

import { BoUser } from '../backoffice';
import { ClRole } from './roles.client.entity';

@Entity('user_role')
@Unique(['userId', 'role'])
export class ClUserRole extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @OneToOne(() => BoUser)
  @JoinColumn({ name: 'user_id' })
  user!: BoUser;

  @Column({ name: 'role_id', type: 'uuid' })
  roleId!: string;

  @ManyToOne(() => ClRole)
  @JoinColumn({ name: 'role_id' })
  role!: ClRole;
}
