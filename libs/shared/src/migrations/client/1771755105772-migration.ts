import { MigrationInterface, QueryRunner } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export class Migration1771755105772 implements MigrationInterface {
  name = 'Migration1771755105772';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const { schema } = queryRunner.connection
      .options as PostgresConnectionOptions;
    await queryRunner.query(
      `CREATE TABLE "${schema}"."files" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "key" character varying NOT NULL, "type" character varying NOT NULL, "mime_type" character varying, "size" integer, CONSTRAINT "UQ_a5c218dfdf6ad6092fed2230a88" UNIQUE ("key"), CONSTRAINT "PK_6c16b9093a142e0e7613b04a3d9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${schema}"."vats" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "name" character varying NOT NULL, "rate" double precision NOT NULL, CONSTRAINT "UQ_752cf3e9c1fcd3648903bd71e3c" UNIQUE ("name"), CONSTRAINT "PK_2af241e093fefa4d4a47eceae85" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${schema}"."products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "product_type" character varying NOT NULL, "designation" character varying NOT NULL, "brand" character varying, "model" character varying, "family" character varying array DEFAULT '{}', "color" character varying, "external_referance" character varying, "pricing_mode" character varying NOT NULL, "coefficient" double precision, "fixed_price" double precision, "fixed_added_amount" double precision, "vat_id" uuid, "stock_quantity" integer, "frame_gender" character varying, "frame_shape" character varying, "frame_material" character varying, "frame_type" character varying, "frame_hinge_type" character varying, "frame_eye_size" integer, "frame_bridge" integer, "frame_temple" integer, "frame_finish" character varying, "lens_type" character varying, "lens_material" character varying, "lens_refractive_index" character varying, "lens_tint" character varying, "lens_treatments" character varying array DEFAULT '{}', "lens_fabricant" character varying, "contact_lens_type" character varying, "contact_lens_usage" character varying, "contact_lens_fabricant" character varying, "contact_lens_base_curve" double precision, "contact_lens_diameter" double precision, "contact_lens_quantity_per_box" integer, "clipon_type" character varying, "clipon_treatments" character varying array DEFAULT '{}', "clipon_tint" character varying, "clipon_compatible_eye_size" character varying, "main_picture_id" uuid, CONSTRAINT "REL_bdf4ca6cfeed60578ba3b07338" UNIQUE ("main_picture_id"), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."products" ADD CONSTRAINT "FK_bdf4ca6cfeed60578ba3b073386" FOREIGN KEY ("main_picture_id") REFERENCES "${schema}"."files"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."products" ADD CONSTRAINT "FK_2312076b1f88656f8e553ea3dbc" FOREIGN KEY ("vat_id") REFERENCES "${schema}"."vats"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const { schema } = queryRunner.connection
      .options as PostgresConnectionOptions;
    await queryRunner.query(
      `ALTER TABLE "${schema}"."products" DROP CONSTRAINT "FK_2312076b1f88656f8e553ea3dbc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."products" DROP CONSTRAINT "FK_bdf4ca6cfeed60578ba3b073386"`,
    );
    await queryRunner.query(`DROP TABLE "${schema}"."products"`);
    await queryRunner.query(`DROP TABLE "${schema}"."vats"`);
    await queryRunner.query(`DROP TABLE "${schema}"."files"`);
  }
}
