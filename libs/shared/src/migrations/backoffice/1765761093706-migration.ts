import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1765761093706 implements MigrationInterface {
  name = 'Migration1765761093706';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "backoffice"."roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "name" character varying NOT NULL, "authorizations" character varying array NOT NULL, CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE ("name"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "backoffice"."users" DROP COLUMN "is_owner"`,
    );
    await queryRunner.query(
      `ALTER TABLE "backoffice"."users" ADD "tenant_group_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "backoffice"."users" ADD CONSTRAINT "FK_53403f80605ad6712266e23d603" FOREIGN KEY ("tenant_group_id") REFERENCES "backoffice"."tenant_groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "backoffice"."users" DROP CONSTRAINT "FK_53403f80605ad6712266e23d603"`,
    );
    await queryRunner.query(
      `ALTER TABLE "backoffice"."users" DROP COLUMN "tenant_group_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "backoffice"."users" ADD "is_owner" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(`DROP TABLE "backoffice"."roles"`);
  }
}
