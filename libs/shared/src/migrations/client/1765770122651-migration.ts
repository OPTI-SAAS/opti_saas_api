import { MigrationInterface, QueryRunner } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export class Migration1765770122651 implements MigrationInterface {
  name = 'Migration1765770122651';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const { schema } = queryRunner.connection
      .options as PostgresConnectionOptions;
    await queryRunner.query(`CREATE VIEW "${schema}"."role_authorizations_view" AS SELECT "ro"."id" AS "role_id", "ro"."name" AS "role_name", "ro"."parent_id" AS "parent_id", "ro"."created_at" AS "created_at", "ro"."updated_at" AS "updated_at", (SELECT COALESCE(
              ARRAY(
                SELECT DISTINCT unnested_auth
                FROM (
                  SELECT UNNEST(COALESCE(br.authorizations, ARRAY[]::varchar[])) AS unnested_auth
                  FROM backoffice.roles br
                  WHERE br.id = a.parent_id
                  
                  UNION
                  
                  SELECT ra.authorization
                  FROM "${schema}".role_authorization ra
                  WHERE ra.role_id = "a"."id" 
                    AND ra.deleted_at IS NULL
                    AND ra.coefficient = 0

                  EXCEPT
                  SELECT ra.authorization
                  FROM "${schema}".role_authorization ra
                  WHERE ra.role_id = "a"."id" 
                    AND ra.deleted_at IS NULL
                    AND ra.coefficient = -1
                ) combined_auths
              ),
              ARRAY[]::varchar[]
            ) FROM "${schema}"."roles" "a" WHERE "a"."deleted_at" IS NULL) AS "authorizations", (SELECT COALESCE(
              ARRAY(
                SELECT ra.authorization
                FROM "${schema}".role_authorization ra
                WHERE ra.role_id = "aa"."id" 
                  AND ra.deleted_at IS NULL
                  AND ra.coefficient = 0
              ),
              ARRAY[]::varchar[]
            ) FROM "${schema}"."roles" "aa" WHERE "aa"."deleted_at" IS NULL) AS "added_authorizations", (SELECT COALESCE(
              ARRAY(
                SELECT ra.authorization
                FROM "${schema}".role_authorization ra
                WHERE ra.role_id = "rva"."id" 
                  AND ra.deleted_at IS NULL
                  AND ra.coefficient = -1
              ),
              ARRAY[]::varchar[]
            ) FROM "${schema}"."roles" "rva" WHERE "rva"."deleted_at" IS NULL) AS "removed_authorizations" FROM "${schema}"."roles" "ro" WHERE ( "ro"."deleted_at" IS NULL ) AND ( "ro"."deleted_at" IS NULL )`);
    await queryRunner.query(
      `INSERT INTO "${schema}"."typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        'client',
        'VIEW',
        'role_authorizations_view',
        'SELECT "ro"."id" AS "role_id", "ro"."name" AS "role_name", "ro"."parent_id" AS "parent_id", "ro"."created_at" AS "created_at", "ro"."updated_at" AS "updated_at", (SELECT COALESCE(\n              ARRAY(\n                SELECT DISTINCT unnested_auth\n                FROM (\n                  SELECT UNNEST(COALESCE(br.authorizations, ARRAY[]::varchar[])) AS unnested_auth\n                  FROM backoffice.roles br\n                  WHERE br.id = a.parent_id\n                  \n                  UNION\n                  \n                  SELECT ra.authorization\n                  FROM "client".role_authorization ra\n                  WHERE ra.role_id = "a"."id" \n                    AND ra.deleted_at IS NULL\n                    AND ra.coefficient = 0\n\n                  EXCEPT\n                  SELECT ra.authorization\n                  FROM "client".role_authorization ra\n                  WHERE ra.role_id = "a"."id" \n                    AND ra.deleted_at IS NULL\n                    AND ra.coefficient = -1\n                ) combined_auths\n              ),\n              ARRAY[]::varchar[]\n            ) FROM "client"."roles" "a" WHERE "a"."deleted_at" IS NULL) AS "authorizations", (SELECT COALESCE(\n              ARRAY(\n                SELECT ra.authorization\n                FROM "client".role_authorization ra\n                WHERE ra.role_id = "aa"."id" \n                  AND ra.deleted_at IS NULL\n                  AND ra.coefficient = 0\n              ),\n              ARRAY[]::varchar[]\n            ) FROM "client"."roles" "aa" WHERE "aa"."deleted_at" IS NULL) AS "added_authorizations", (SELECT COALESCE(\n              ARRAY(\n                SELECT ra.authorization\n                FROM "client".role_authorization ra\n                WHERE ra.role_id = "rva"."id" \n                  AND ra.deleted_at IS NULL\n                  AND ra.coefficient = -1\n              ),\n              ARRAY[]::varchar[]\n            ) FROM "client"."roles" "rva" WHERE "rva"."deleted_at" IS NULL) AS "removed_authorizations" FROM "client"."roles" "ro" WHERE ( "ro"."deleted_at" IS NULL ) AND ( "ro"."deleted_at" IS NULL )',
      ],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const { schema } = queryRunner.connection
      .options as PostgresConnectionOptions;
    await queryRunner.query(
      `DELETE FROM "${schema}"."typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
      ['VIEW', 'role_authorizations_view', 'client'],
    );
    await queryRunner.query(`DROP VIEW "${schema}"."role_authorizations_view"`);
  }
}
