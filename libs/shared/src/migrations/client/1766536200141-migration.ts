import { MigrationInterface, QueryRunner } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export class Migration1766536200141 implements MigrationInterface {
  name = 'Migration1766536200141';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const { schema } = queryRunner.connection
      .options as PostgresConnectionOptions;
    await queryRunner.query(
      `CREATE TABLE "${schema}"."roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "parent_id" uuid, "name" character varying NOT NULL, CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE ("name"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${schema}"."role_authorization" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "role_id" uuid NOT NULL, "authorization" character varying NOT NULL, "coefficient" smallint NOT NULL, CONSTRAINT "UQ_f3801d682eee7a88598ba145e79" UNIQUE ("authorization"), CONSTRAINT "UQ_b3102366637a511ea833d044fcb" UNIQUE ("role_id", "authorization", "coefficient"), CONSTRAINT "PK_fcc88de2e59be380c26c0fdae77" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_eff7895aaeb7f28bd5d22fa1ab" ON "${schema}"."role_authorization" ("role_id", "deleted_at", "coefficient") `,
    );
    await queryRunner.query(
      `CREATE TABLE "${schema}"."user_role" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "user_id" uuid NOT NULL, "role_id" uuid NOT NULL, CONSTRAINT "UQ_f634684acb47c1a158b83af5150" UNIQUE ("user_id", "role_id"), CONSTRAINT "REL_d0e5815877f7395a198a4cb0a4" UNIQUE ("user_id"), CONSTRAINT "PK_fb2e442d14add3cefbdf33c4561" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."roles" ADD CONSTRAINT "FK_3e97eeaf865aeda0d20c0c5c509" FOREIGN KEY ("parent_id") REFERENCES "backoffice"."roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."role_authorization" ADD CONSTRAINT "FK_a1ab53228638606b70a801f2de7" FOREIGN KEY ("role_id") REFERENCES "${schema}"."roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."user_role" ADD CONSTRAINT "FK_d0e5815877f7395a198a4cb0a46" FOREIGN KEY ("user_id") REFERENCES "backoffice"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."user_role" ADD CONSTRAINT "FK_32a6fc2fcb019d8e3a8ace0f55f" FOREIGN KEY ("role_id") REFERENCES "${schema}"."roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
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
    await queryRunner.query(
      `ALTER TABLE "${schema}"."user_role" DROP CONSTRAINT "FK_32a6fc2fcb019d8e3a8ace0f55f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."user_role" DROP CONSTRAINT "FK_d0e5815877f7395a198a4cb0a46"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."role_authorization" DROP CONSTRAINT "FK_a1ab53228638606b70a801f2de7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."roles" DROP CONSTRAINT "FK_3e97eeaf865aeda0d20c0c5c509"`,
    );
    await queryRunner.query(`DROP TABLE "${schema}"."user_role"`);
    await queryRunner.query(
      `DROP INDEX "${schema}"."IDX_eff7895aaeb7f28bd5d22fa1ab"`,
    );
    await queryRunner.query(`DROP TABLE "${schema}"."role_authorization"`);
    await queryRunner.query(`DROP TABLE "${schema}"."roles"`);
  }
}
