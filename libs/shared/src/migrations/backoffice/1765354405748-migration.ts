import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1765354405748 implements MigrationInterface {
  name = 'Migration1765354405748';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "backoffice"."users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "first_name" character varying(255) NOT NULL, "last_name" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "password" character varying(255) NOT NULL, "is_owner" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "backoffice"."user_tenants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "user_id" uuid NOT NULL, "tenant_id" uuid NOT NULL, CONSTRAINT "UQ_01847c3ffef489ea549f205d1ed" UNIQUE ("user_id", "tenant_id"), CONSTRAINT "PK_aff681c6ee0171ce3cb116ea83f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "backoffice"."tenants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "db_schema" character varying, "name" character varying NOT NULL, "tenant_group_id" uuid, CONSTRAINT "UQ_0122790d7a912e550d3127b84ec" UNIQUE ("db_schema"), CONSTRAINT "UQ_32731f181236a46182a38c992a8" UNIQUE ("name"), CONSTRAINT "PK_53be67a04681c66b87ee27c9321" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "backoffice"."tenant_groups" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "owner_user_id" uuid NOT NULL, CONSTRAINT "UQ_13bda234d46f31d8dc12711eea8" UNIQUE ("owner_user_id"), CONSTRAINT "REL_13bda234d46f31d8dc12711eea" UNIQUE ("owner_user_id"), CONSTRAINT "PK_e2d01b172547474a9bba87dc620" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "backoffice"."user_tenants" ADD CONSTRAINT "FK_63a8ef4ed4fad61231cdfc3dc63" FOREIGN KEY ("user_id") REFERENCES "backoffice"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "backoffice"."user_tenants" ADD CONSTRAINT "FK_a1feca39273dfd9a32c7cc4153c" FOREIGN KEY ("tenant_id") REFERENCES "backoffice"."tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "backoffice"."tenants" ADD CONSTRAINT "FK_8383b5f6cc003d3a029261c7b5b" FOREIGN KEY ("tenant_group_id") REFERENCES "backoffice"."tenant_groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "backoffice"."tenant_groups" ADD CONSTRAINT "FK_13bda234d46f31d8dc12711eea8" FOREIGN KEY ("owner_user_id") REFERENCES "backoffice"."users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "backoffice"."tenant_groups" DROP CONSTRAINT "FK_13bda234d46f31d8dc12711eea8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "backoffice"."tenants" DROP CONSTRAINT "FK_8383b5f6cc003d3a029261c7b5b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "backoffice"."user_tenants" DROP CONSTRAINT "FK_a1feca39273dfd9a32c7cc4153c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "backoffice"."user_tenants" DROP CONSTRAINT "FK_63a8ef4ed4fad61231cdfc3dc63"`,
    );
    await queryRunner.query(`DROP TABLE "backoffice"."tenant_groups"`);
    await queryRunner.query(`DROP TABLE "backoffice"."tenants"`);
    await queryRunner.query(`DROP TABLE "backoffice"."user_tenants"`);
    await queryRunner.query(`DROP TABLE "backoffice"."users"`);
  }
}
