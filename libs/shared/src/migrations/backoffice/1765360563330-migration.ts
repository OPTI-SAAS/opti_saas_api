import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1765360563330 implements MigrationInterface {
  name = 'Migration1765360563330';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "backoffice"."users" ADD "refresh_token" character varying(500)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "backoffice"."users" DROP COLUMN "refresh_token"`,
    );
  }
}
