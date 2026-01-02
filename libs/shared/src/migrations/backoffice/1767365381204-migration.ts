import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1767365381204 implements MigrationInterface {
  name = 'Migration1767365381204';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "backoffice"."roles" ADD "is_admin" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "backoffice"."tenants" ALTER COLUMN "db_schema" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "backoffice"."tenants" ALTER COLUMN "db_schema" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "backoffice"."roles" DROP COLUMN "is_admin"`,
    );
  }
}
