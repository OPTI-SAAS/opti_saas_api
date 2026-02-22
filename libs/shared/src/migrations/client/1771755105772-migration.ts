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
      `CREATE TABLE "${schema}"."products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "internal_code" character varying NOT NULL, "barcode" character varying, "product_type" character varying NOT NULL, "designation" character varying NOT NULL, "brand_id" uuid, "model_id" uuid, "color" character varying, "supplier_reference" character varying, "family_id" uuid, "sub_family_id" uuid, "alert_threshold" integer NOT NULL DEFAULT '0', "purchase_price_ht" double precision NOT NULL, "coefficient" double precision NOT NULL DEFAULT '1', "vat_id" uuid, "status" character varying NOT NULL, "product_photo_id" uuid, "frame_category" character varying, "gender" character varying, "shape" character varying, "material" character varying, "frame_type" character varying, "hinge_type" character varying, "eye_size" integer, "bridge" integer, "temple" integer, "frame_color" character varying, "temple_color" character varying, "lens_type" character varying, "refractive_index" character varying, "tint" character varying, "filters" character varying array NOT NULL DEFAULT '{}', "treatments" character varying array NOT NULL DEFAULT '{}', "sphere_power" double precision, "cylinder_power" double precision, "axis" double precision, "addition" double precision, "diameter" double precision, "base_curve" double precision, "curvature" double precision, "optical_family" character varying, "contact_lens_type" character varying, "usage" character varying, "commercial_model" character varying, "cylinder" double precision, "batch_number" character varying, CONSTRAINT "UQ_01fc9104524def06b3392d57951" UNIQUE ("internal_code"), CONSTRAINT "UQ_88121f0dbff7199fded36509557" UNIQUE ("product_photo_id"), CONSTRAINT "REL_88121f0dbff7199fded3650955" UNIQUE ("product_photo_id"), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."products" ADD CONSTRAINT "FK_2312076b1f88656f8e553ea3dbc" FOREIGN KEY ("vat_id") REFERENCES "${schema}"."vats"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."products" ADD CONSTRAINT "FK_88121f0dbff7199fded36509557" FOREIGN KEY ("product_photo_id") REFERENCES "${schema}"."files"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const { schema } = queryRunner.connection
      .options as PostgresConnectionOptions;
    await queryRunner.query(
      `ALTER TABLE "${schema}"."products" DROP CONSTRAINT "FK_88121f0dbff7199fded36509557"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."products" DROP CONSTRAINT "FK_2312076b1f88656f8e553ea3dbc"`,
    );
    await queryRunner.query(`DROP TABLE "${schema}"."products"`);
    await queryRunner.query(`DROP TABLE "${schema}"."vats"`);
    await queryRunner.query(`DROP TABLE "${schema}"."files"`);
  }
}
