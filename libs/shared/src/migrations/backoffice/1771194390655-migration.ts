import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1771194390655 implements MigrationInterface {
  name = 'Migration1771194390655';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "backoffice"."tenants" ADD "bucket_name" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "backoffice"."tenants" DROP COLUMN "bucket_name"`,
    );
  }
}
