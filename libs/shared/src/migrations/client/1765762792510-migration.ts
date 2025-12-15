import { MigrationInterface, QueryRunner } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export class Migration1765762792510 implements MigrationInterface {
  name = 'Migration1765762792510';

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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const { schema } = queryRunner.connection
      .options as PostgresConnectionOptions;
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
