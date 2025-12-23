import { BaseEntity } from '@lib/shared/base';
import { ResourceAuthorizations } from '@optisaas/opti-saas-lib';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

type RouteType = 'group' | 'sub-group' | 'group-link' | 'link';

@Entity('routes', { schema: 'backoffice' })
export class BoRoute extends BaseEntity {
  @Column({ name: '_type', type: 'varchar' })
  _type!: RouteType;

  @Column({ name: 'label', type: 'varchar', nullable: true })
  label?: string;

  @Column({ name: 'icon', type: 'varchar', nullable: true })
  icon?: string;

  @Column({ name: 'route', type: 'varchar', nullable: true })
  route?: string;

  @Column({ name: 'external_url', type: 'varchar', nullable: true })
  externalUrl?: string;

  @Column({ type: 'uuid', name: 'parent_id', nullable: true })
  parentId?: string | null;

  @OneToMany(() => BoRoute, (route) => route.parent)
  childrens?: BoRoute[];

  @ManyToOne(() => BoRoute, (route) => route.childrens, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_id' })
  parent?: BoRoute;

  @Column('varchar', { name: 'authorizations_needed', array: true })
  authorizations_needed!: ResourceAuthorizations[];

  @Column({
    name: 'is_all_authorizations_needed',
    type: 'boolean',
    default: false,
  })
  isAllAuthsNeeded?: boolean;

  @Column({ default: false })
  disabled?: boolean;
}
