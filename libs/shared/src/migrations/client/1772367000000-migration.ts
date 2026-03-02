import { MigrationInterface, QueryRunner } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export class Migration1772367000000 implements MigrationInterface {
  name = 'Migration1772367000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const { schema } = queryRunner.connection
      .options as PostgresConnectionOptions;

    await queryRunner.query(
      `ALTER TABLE "${schema}"."stock_entry_lines" ADD "purchase_price" double precision`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."stock_items" ADD "purchase_price" double precision`,
    );

    await queryRunner.query(
      `ALTER TABLE "${schema}"."stock_entry_lines" ADD CONSTRAINT "CHK_stock_entry_lines_purchase_price_non_negative" CHECK (purchase_price IS NULL OR purchase_price >= 0)`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."stock_items" ADD CONSTRAINT "CHK_stock_items_purchase_price_non_negative" CHECK (purchase_price IS NULL OR purchase_price >= 0)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const { schema } = queryRunner.connection
      .options as PostgresConnectionOptions;

    await queryRunner.query(
      `ALTER TABLE "${schema}"."stock_items" DROP CONSTRAINT "CHK_stock_items_purchase_price_non_negative"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."stock_entry_lines" DROP CONSTRAINT "CHK_stock_entry_lines_purchase_price_non_negative"`,
    );

    await queryRunner.query(
      `ALTER TABLE "${schema}"."stock_items" DROP COLUMN "purchase_price"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."stock_entry_lines" DROP COLUMN "purchase_price"`,
    );
  }
}
