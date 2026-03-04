import { MigrationInterface, QueryRunner } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export class AddFamilyGroups1772700100000 implements MigrationInterface {
  name = 'AddFamilyGroups1772700100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const { schema } = queryRunner.connection
      .options as PostgresConnectionOptions;

    // --- family_groups table ---
    await queryRunner.query(
      `CREATE TABLE "${schema}"."family_groups" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "nom" character varying NOT NULL,
        "notes" text,
        CONSTRAINT "PK_family_groups" PRIMARY KEY ("id")
      )`,
    );

    // --- Alter clients.family_group_id from integer to uuid ---
    // Drop the existing index
    await queryRunner.query(
      `DROP INDEX IF EXISTS "${schema}"."IDX_clients_family_group"`,
    );

    // Drop the column and re-create it as uuid
    await queryRunner.query(
      `ALTER TABLE "${schema}"."clients" DROP COLUMN "family_group_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."clients" ADD COLUMN "family_group_id" uuid`,
    );

    // Re-create the index
    await queryRunner.query(
      `CREATE INDEX "IDX_clients_family_group" ON "${schema}"."clients" ("family_group_id")`,
    );

    // Add FK constraint
    await queryRunner.query(
      `ALTER TABLE "${schema}"."clients" ADD CONSTRAINT "FK_clients_family_group" FOREIGN KEY ("family_group_id") REFERENCES "${schema}"."family_groups"("id") ON DELETE SET NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const { schema } = queryRunner.connection
      .options as PostgresConnectionOptions;

    // Drop FK constraint
    await queryRunner.query(
      `ALTER TABLE "${schema}"."clients" DROP CONSTRAINT IF EXISTS "FK_clients_family_group"`,
    );

    // Drop index
    await queryRunner.query(
      `DROP INDEX IF EXISTS "${schema}"."IDX_clients_family_group"`,
    );

    // Revert column back to integer
    await queryRunner.query(
      `ALTER TABLE "${schema}"."clients" DROP COLUMN "family_group_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."clients" ADD COLUMN "family_group_id" integer`,
    );

    // Re-create old index
    await queryRunner.query(
      `CREATE INDEX "IDX_clients_family_group" ON "${schema}"."clients" ("family_group_id")`,
    );

    // Drop family_groups table
    await queryRunner.query(`DROP TABLE "${schema}"."family_groups"`);
  }
}
