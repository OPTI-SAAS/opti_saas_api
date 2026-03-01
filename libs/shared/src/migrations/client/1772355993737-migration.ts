import { MigrationInterface, QueryRunner } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export class Migration1772355993737 implements MigrationInterface {
  name = 'Migration1772355993737';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const { schema } = queryRunner.connection
      .options as PostgresConnectionOptions;
    await queryRunner.query(
      `CREATE TABLE "${schema}"."stock_entries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "supplier_id" uuid NOT NULL, "file_id" uuid, "created_by_user_id" uuid NOT NULL, CONSTRAINT "PK_a1fd9172ea87dc2940230c57f48" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${schema}"."stock_entry_lines" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "stock_entry_id" uuid NOT NULL, "product_id" uuid NOT NULL, "warehouse_id" uuid NOT NULL, "quantity" integer NOT NULL, CONSTRAINT "UQ_stock_entry_lines_entry_product_warehouse" UNIQUE ("stock_entry_id", "product_id", "warehouse_id"), CONSTRAINT "CHK_stock_entry_lines_quantity_positive" CHECK (quantity > 0), CONSTRAINT "PK_6643a572b160802097bbb4f5acc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${schema}"."stock_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "product_id" uuid NOT NULL, "warehouse_id" uuid NOT NULL, "stock_entry_id" uuid NOT NULL, "status" character varying NOT NULL DEFAULT 'active', CONSTRAINT "PK_52a266aa3e04b8ad1f01088f3f0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_stock_items_product_status" ON "${schema}"."stock_items" ("product_id", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_stock_items_warehouse_status" ON "${schema}"."stock_items" ("warehouse_id", "status") `,
    );
    await queryRunner.query(
      `CREATE TABLE "${schema}"."stock_movement_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "stock_item_id" uuid NOT NULL, "movement_type" character varying NOT NULL, "from_warehouse_id" uuid, "to_warehouse_id" uuid, "removal_reason" character varying, "stock_entry_id" uuid, "performed_by_user_id" uuid NOT NULL, CONSTRAINT "PK_8e8b207f2b8ae7fa2a2e7c95738" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_stock_movement_history_to_created_at" ON "${schema}"."stock_movement_history" ("to_warehouse_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_stock_movement_history_from_created_at" ON "${schema}"."stock_movement_history" ("from_warehouse_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_stock_movement_history_item_created_at" ON "${schema}"."stock_movement_history" ("stock_item_id", "created_at") `,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."stock_entries" ADD CONSTRAINT "FK_ae261eab5ce1ae5b1327eeafecc" FOREIGN KEY ("supplier_id") REFERENCES "${schema}"."suppliers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."stock_entries" ADD CONSTRAINT "FK_85340b9bf4475e1046e465af636" FOREIGN KEY ("file_id") REFERENCES "${schema}"."files"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."stock_entry_lines" ADD CONSTRAINT "FK_b5937cb7e7ad479a4df8ec8f4cc" FOREIGN KEY ("stock_entry_id") REFERENCES "${schema}"."stock_entries"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."stock_entry_lines" ADD CONSTRAINT "FK_07b2a76022a7e9883ec2ac82972" FOREIGN KEY ("product_id") REFERENCES "${schema}"."products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."stock_entry_lines" ADD CONSTRAINT "FK_50604e3cfaa345b43f8be97e020" FOREIGN KEY ("warehouse_id") REFERENCES "${schema}"."warehouses"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."stock_items" ADD CONSTRAINT "FK_7d35d70ec8771bb8c5f262d4d7f" FOREIGN KEY ("product_id") REFERENCES "${schema}"."products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."stock_items" ADD CONSTRAINT "FK_5464525834215161cb9e33fc459" FOREIGN KEY ("warehouse_id") REFERENCES "${schema}"."warehouses"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."stock_items" ADD CONSTRAINT "FK_0d04d1359afe6ba8691a5d270f8" FOREIGN KEY ("stock_entry_id") REFERENCES "${schema}"."stock_entries"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."stock_movement_history" ADD CONSTRAINT "FK_5eba38d9b6a950138a6af08f0c6" FOREIGN KEY ("stock_item_id") REFERENCES "${schema}"."stock_items"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."stock_movement_history" ADD CONSTRAINT "FK_a5bec46806b1ebc6afa7cf499be" FOREIGN KEY ("from_warehouse_id") REFERENCES "${schema}"."warehouses"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."stock_movement_history" ADD CONSTRAINT "FK_9813afae9999f3db533e4c766a0" FOREIGN KEY ("to_warehouse_id") REFERENCES "${schema}"."warehouses"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."stock_movement_history" ADD CONSTRAINT "FK_0f67dc847c3b1a845baf6c9eaa5" FOREIGN KEY ("stock_entry_id") REFERENCES "${schema}"."stock_entries"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const { schema } = queryRunner.connection
      .options as PostgresConnectionOptions;
    await queryRunner.query(
      `ALTER TABLE "${schema}"."stock_movement_history" DROP CONSTRAINT "FK_0f67dc847c3b1a845baf6c9eaa5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."stock_movement_history" DROP CONSTRAINT "FK_9813afae9999f3db533e4c766a0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."stock_movement_history" DROP CONSTRAINT "FK_a5bec46806b1ebc6afa7cf499be"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."stock_movement_history" DROP CONSTRAINT "FK_5eba38d9b6a950138a6af08f0c6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."stock_items" DROP CONSTRAINT "FK_0d04d1359afe6ba8691a5d270f8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."stock_items" DROP CONSTRAINT "FK_5464525834215161cb9e33fc459"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."stock_items" DROP CONSTRAINT "FK_7d35d70ec8771bb8c5f262d4d7f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."stock_entry_lines" DROP CONSTRAINT "FK_50604e3cfaa345b43f8be97e020"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."stock_entry_lines" DROP CONSTRAINT "FK_07b2a76022a7e9883ec2ac82972"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."stock_entry_lines" DROP CONSTRAINT "FK_b5937cb7e7ad479a4df8ec8f4cc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."stock_entries" DROP CONSTRAINT "FK_85340b9bf4475e1046e465af636"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."stock_entries" DROP CONSTRAINT "FK_ae261eab5ce1ae5b1327eeafecc"`,
    );
    await queryRunner.query(
      `DROP INDEX "${schema}"."IDX_stock_movement_history_item_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "${schema}"."IDX_stock_movement_history_from_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "${schema}"."IDX_stock_movement_history_to_created_at"`,
    );
    await queryRunner.query(`DROP TABLE "${schema}"."stock_movement_history"`);
    await queryRunner.query(
      `DROP INDEX "${schema}"."IDX_stock_items_warehouse_status"`,
    );
    await queryRunner.query(
      `DROP INDEX "${schema}"."IDX_stock_items_product_status"`,
    );
    await queryRunner.query(`DROP TABLE "${schema}"."stock_items"`);
    await queryRunner.query(`DROP TABLE "${schema}"."stock_entry_lines"`);
    await queryRunner.query(`DROP TABLE "${schema}"."stock_entries"`);
  }
}
