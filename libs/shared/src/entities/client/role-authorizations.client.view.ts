import { ResourceAuthorizations } from '@optisaas/opti-saas-lib';
import { Column, ViewEntity } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

@ViewEntity({
  name: 'role_authorizations_view',
  expression: (connection) => {
    const { schema } = connection.options as PostgresConnectionOptions;

    return connection
      .createQueryBuilder()
      .select('ro.id', 'role_id')
      .addSelect('ro.name', 'role_name')
      .addSelect('ro.parent_id', 'parent_id')
      .addSelect('ro.created_at', 'created_at')
      .addSelect('ro.updated_at', 'updated_at')
      .addSelect((subQuery) => {
        return subQuery
          .select(
            `COALESCE(
              ARRAY(
                SELECT DISTINCT unnested_auth
                FROM (
                  SELECT UNNEST(COALESCE(br.authorizations, ARRAY[]::varchar[])) AS unnested_auth
                  FROM backoffice.roles br
                  WHERE br.id = a.parent_id
                  
                  UNION
                  
                  SELECT ra.authorization
                  FROM "${schema}".role_authorization ra
                  WHERE ra.role_id = a.id 
                    AND ra.deleted_at IS NULL
                    AND ra.coefficient = 0

                  EXCEPT
                  SELECT ra.authorization
                  FROM "${schema}".role_authorization ra
                  WHERE ra.role_id = a.id 
                    AND ra.deleted_at IS NULL
                    AND ra.coefficient = -1
                ) combined_auths
              ),
              ARRAY[]::varchar[]
            )`,
          )
          .from(`${schema}.roles`, 'a');
      }, 'authorizations')
      .addSelect((subQuery) => {
        return subQuery
          .select(
            `COALESCE(
              ARRAY(
                SELECT ra.authorization
                FROM "${schema}".role_authorization ra
                WHERE ra.role_id = aa.id 
                  AND ra.deleted_at IS NULL
                  AND ra.coefficient = 0
              ),
              ARRAY[]::varchar[]
            )`,
          )
          .from(`${schema}.roles`, 'aa');
      }, 'added_authorizations')
      .addSelect((subQuery) => {
        return subQuery
          .select(
            `COALESCE(
              ARRAY(
                SELECT ra.authorization
                FROM "${schema}".role_authorization ra
                WHERE ra.role_id = rva.id 
                  AND ra.deleted_at IS NULL
                  AND ra.coefficient = -1
              ),
              ARRAY[]::varchar[]
            )`,
          )
          .from(`${schema}.roles`, 'rva');
      }, 'removed_authorizations')
      .from(`${schema}.roles`, 'ro')
      .where('ro.deleted_at IS NULL');
  },
})
export class ClRoleAuthorizationsView {
  @Column({ name: 'role_id', type: 'uuid' })
  roleId!: string;

  @Column({ name: 'role_name', type: 'varchar' })
  roleName!: string;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId?: string;

  @Column({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;

  @Column('varchar', { name: 'authorizations', array: true })
  authorizations!: ResourceAuthorizations[];

  @Column('varchar', { name: 'added_authorizations', array: true })
  addedAuthorizations!: ResourceAuthorizations[];

  @Column('varchar', { name: 'removed_authorizations', array: true })
  removedAuthorizations!: ResourceAuthorizations[];
}
