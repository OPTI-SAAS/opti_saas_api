import { MigrationInterface, QueryRunner } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export class Migration1772349666857 implements MigrationInterface {
  name = 'Migration1772349666857';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const { schema } = queryRunner.connection
      .options as PostgresConnectionOptions;
    await queryRunner.query(
      `CREATE TABLE "${schema}"."suppliers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "name" character varying NOT NULL, "description" character varying, CONSTRAINT "UQ_5b5720d9645cee7396595a16c93" UNIQUE ("name"), CONSTRAINT "PK_b70ac51766a9e3144f778cfe81e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${schema}"."product_suppliers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "product_id" uuid NOT NULL, "supplier_id" uuid NOT NULL, "product_referance_code" character varying NOT NULL, CONSTRAINT "UQ_product_suppliers_product_supplier" UNIQUE ("product_id", "supplier_id"), CONSTRAINT "PK_96f9e4cfe1a097fdd2a9a67257a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."product_suppliers" ADD CONSTRAINT "FK_c1b61c92463463f577fac49b95c" FOREIGN KEY ("product_id") REFERENCES "${schema}"."products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."product_suppliers" ADD CONSTRAINT "FK_be4a36f37c7345ab274ec4656d2" FOREIGN KEY ("supplier_id") REFERENCES "${schema}"."suppliers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const { schema } = queryRunner.connection
      .options as PostgresConnectionOptions;
    await queryRunner.query(
      `ALTER TABLE "${schema}"."product_suppliers" DROP CONSTRAINT "FK_be4a36f37c7345ab274ec4656d2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."product_suppliers" DROP CONSTRAINT "FK_c1b61c92463463f577fac49b95c"`,
    );
    await queryRunner.query(`DROP TABLE "${schema}"."product_suppliers"`);
    await queryRunner.query(`DROP TABLE "${schema}"."suppliers"`);
  }
}
