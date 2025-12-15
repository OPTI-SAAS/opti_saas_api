import { BaseEntity } from '@lib/shared/base';
import { ResourceAuthorizations } from '@optisaas/opti-saas-lib';
import { Column, Entity } from 'typeorm';

@Entity('roles', { schema: 'backoffice' })
export class BoRole extends BaseEntity {
  @Column({ name: 'name', type: 'varchar', unique: true })
  name!: string;

  @Column('varchar', { name: 'authorizations', array: true, nullable: false })
  authorizations!: ResourceAuthorizations[];
}
