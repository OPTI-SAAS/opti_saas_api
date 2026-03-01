import { MigrationInterface, QueryRunner } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export class Migration1772401573373 implements MigrationInterface {
  name = 'Migration1772401573373';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const { schema } = queryRunner.connection
      .options as PostgresConnectionOptions;
    await queryRunner.query(
      `ALTER TABLE "${schema}"."stock_entries" DROP CONSTRAINT "FK_85340b9bf4475e1046e465af636"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."stock_entries" ALTER COLUMN "file_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."stock_entries" ADD CONSTRAINT "FK_85340b9bf4475e1046e465af636" FOREIGN KEY ("file_id") REFERENCES "${schema}"."files"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const { schema } = queryRunner.connection
      .options as PostgresConnectionOptions;
    await queryRunner.query(
      `ALTER TABLE "${schema}"."stock_entries" DROP CONSTRAINT "FK_85340b9bf4475e1046e465af636"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."stock_entries" ALTER COLUMN "file_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."stock_entries" ADD CONSTRAINT "FK_85340b9bf4475e1046e465af636" FOREIGN KEY ("file_id") REFERENCES "${schema}"."files"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }
}
