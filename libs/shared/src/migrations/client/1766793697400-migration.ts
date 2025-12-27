import { MigrationInterface, QueryRunner } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export class Migration1766793697400 implements MigrationInterface {
  name = 'Migration1766793697400';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const { schema } = queryRunner.connection
      .options as PostgresConnectionOptions;
    await queryRunner.query(
      `ALTER TABLE "${schema}"."role_authorization" DROP CONSTRAINT "UQ_b3102366637a511ea833d044fcb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."role_authorization" DROP CONSTRAINT "UQ_f3801d682eee7a88598ba145e79"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."role_authorization" ADD CONSTRAINT "UQ_b3102366637a511ea833d044fcb" UNIQUE ("role_id", "authorization", "coefficient")`,
    );
    await queryRunner.query(`CREATE VIEW "${schema}"."role_authorizations_view" AS SELECT "ro"."id" AS "role_id", "ro"."name" AS "role_name", "ro"."parent_id" AS "parent_id", "ro"."created_at" AS "created_at", "ro"."updated_at" AS "updated_at", 
            COALESCE(
              ARRAY(
                SELECT ra.authorization
                FROM "${schema}".role_authorization ra
                WHERE ra.role_id = ro.id
                  AND ra.deleted_at IS NULL
                  AND ra.coefficient = 0
              ),
              ARRAY[]::varchar[]
            )
             AS "added_authorizations", 
              COALESCE(
                ARRAY(
                  SELECT ra.authorization
                  FROM "${schema}".role_authorization ra
                  WHERE ra.role_id = ro.id
                    AND ra.deleted_at IS NULL
                    AND ra.coefficient = -1
                ),
                ARRAY[]::varchar[]
              )
               AS "removed_authorizations", 
      COALESCE(
        ARRAY(
          SELECT DISTINCT auth
          FROM (
            -- parent auths from backoffice role
            SELECT unnest(COALESCE(br.authorizations, ARRAY[]::varchar[])) AS auth
            FROM backoffice.roles br
            WHERE br.id = ro.parent_id

            UNION

            -- added
            SELECT ra.authorization AS auth
            FROM "${schema}".role_authorization ra
            WHERE ra.role_id = ro.id
              AND ra.deleted_at IS NULL
              AND ra.coefficient = 0

            EXCEPT

            -- removed
            SELECT ra.authorization AS auth
            FROM "${schema}".role_authorization ra
            WHERE ra.role_id = ro.id
              AND ra.deleted_at IS NULL
              AND ra.coefficient = -1
          ) x
        ),
        ARRAY[]::varchar[]
      )
       AS "authorizations" FROM "${schema}"."roles" "ro" WHERE ( "ro"."deleted_at" IS NULL ) AND ( "ro"."deleted_at" IS NULL )`);
    await queryRunner.query(
      `INSERT INTO "${schema}"."typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        'client',
        'VIEW',
        'role_authorizations_view',
        'SELECT "ro"."id" AS "role_id", "ro"."name" AS "role_name", "ro"."parent_id" AS "parent_id", "ro"."created_at" AS "created_at", "ro"."updated_at" AS "updated_at", \n            COALESCE(\n              ARRAY(\n                SELECT ra.authorization\n                FROM "client".role_authorization ra\n                WHERE ra.role_id = ro.id\n                  AND ra.deleted_at IS NULL\n                  AND ra.coefficient = 0\n              ),\n              ARRAY[]::varchar[]\n            )\n             AS "added_authorizations", \n              COALESCE(\n                ARRAY(\n                  SELECT ra.authorization\n                  FROM "client".role_authorization ra\n                  WHERE ra.role_id = ro.id\n                    AND ra.deleted_at IS NULL\n                    AND ra.coefficient = -1\n                ),\n                ARRAY[]::varchar[]\n              )\n               AS "removed_authorizations", \n      COALESCE(\n        ARRAY(\n          SELECT DISTINCT auth\n          FROM (\n            -- parent auths from backoffice role\n            SELECT unnest(COALESCE(br.authorizations, ARRAY[]::varchar[])) AS auth\n            FROM backoffice.roles br\n            WHERE br.id = ro.parent_id\n\n            UNION\n\n            -- added\n            SELECT ra.authorization AS auth\n            FROM "client".role_authorization ra\n            WHERE ra.role_id = ro.id\n              AND ra.deleted_at IS NULL\n              AND ra.coefficient = 0\n\n            EXCEPT\n\n            -- removed\n            SELECT ra.authorization AS auth\n            FROM "client".role_authorization ra\n            WHERE ra.role_id = ro.id\n              AND ra.deleted_at IS NULL\n              AND ra.coefficient = -1\n          ) x\n        ),\n        ARRAY[]::varchar[]\n      )\n       AS "authorizations" FROM "client"."roles" "ro" WHERE ( "ro"."deleted_at" IS NULL ) AND ( "ro"."deleted_at" IS NULL )',
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
    await queryRunner.query(
      `ALTER TABLE "${schema}"."role_authorization" DROP CONSTRAINT "UQ_b3102366637a511ea833d044fcb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."role_authorization" ADD CONSTRAINT "UQ_f3801d682eee7a88598ba145e79" UNIQUE ("authorization")`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."role_authorization" ADD CONSTRAINT "UQ_b3102366637a511ea833d044fcb" UNIQUE ("role_id", "authorization", "coefficient")`,
    );
  }
}
