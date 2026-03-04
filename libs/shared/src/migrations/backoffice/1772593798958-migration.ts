import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1772593798958 implements MigrationInterface {
  name = 'Migration1772593798958';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "backoffice"."users" ADD "mobile" character varying(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "backoffice"."users" ADD "status" character varying(30) NOT NULL DEFAULT 'active'`,
    );
    await queryRunner.query(
      `ALTER TABLE "backoffice"."users" ADD "last_login_at" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "backoffice"."users" DROP COLUMN "last_login_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "backoffice"."users" DROP COLUMN "status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "backoffice"."users" DROP COLUMN "mobile"`,
    );
  }
}
