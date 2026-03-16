import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1773897600000 implements MigrationInterface {
  name = 'Migration1773897600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "backoffice"."users" RENAME COLUMN "mobile" TO "mobile_phone"`,
    );
    await queryRunner.query(
      `ALTER TABLE "backoffice"."users" ADD "mobile_country_code" character varying(10)`,
    );
    await queryRunner.query(
      `ALTER TABLE "backoffice"."users" ADD "agreement" character varying(255)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "backoffice"."users" DROP COLUMN "agreement"`,
    );
    await queryRunner.query(
      `ALTER TABLE "backoffice"."users" DROP COLUMN "mobile_country_code"`,
    );
    await queryRunner.query(
      `ALTER TABLE "backoffice"."users" RENAME COLUMN "mobile_phone" TO "mobile"`,
    );
  }
}
