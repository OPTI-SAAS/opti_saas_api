import { MigrationInterface, QueryRunner } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export class AddPassagerMinorFamilyLinkAddress1772800000000 implements MigrationInterface {
  name = 'AddPassagerMinorFamilyLinkAddress1772800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const { schema } = queryRunner.connection
      .options as PostgresConnectionOptions;

    // --- Add passager boolean column to clients ---
    await queryRunner.query(
      `ALTER TABLE "${schema}"."clients" ADD COLUMN "passager" boolean DEFAULT false`,
    );

    // --- Add is_minor boolean column to clients ---
    await queryRunner.query(
      `ALTER TABLE "${schema}"."clients" ADD COLUMN "is_minor" boolean DEFAULT false`,
    );

    // --- Migrate existing 'passage' rows: set passager=true and type='particulier' ---
    await queryRunner.query(
      `UPDATE "${schema}"."clients" SET "passager" = true, "type" = 'particulier' WHERE "type" = 'passage'`,
    );

    // --- Update type CHECK constraint: remove 'passage', keep 'particulier' and 'professionnel' ---
    await queryRunner.query(
      `ALTER TABLE "${schema}"."clients" DROP CONSTRAINT IF EXISTS "CHK_clients_type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."clients" ADD CONSTRAINT "CHK_clients_type" CHECK (type IN ('particulier', 'professionnel'))`,
    );

    // --- Add family_link CHECK constraint ---
    await queryRunner.query(
      `ALTER TABLE "${schema}"."clients" ADD CONSTRAINT "CHK_clients_family_link" CHECK (family_link IS NULL OR family_link IN ('principal', 'conjoint', 'tutor', 'parent', 'children'))`,
    );

    // --- Add tutor_id UUID column to clients (self-referential FK) ---
    await queryRunner.query(
      `ALTER TABLE "${schema}"."clients" ADD COLUMN "tutor_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."clients" ADD CONSTRAINT "FK_clients_tutor" FOREIGN KEY ("tutor_id") REFERENCES "${schema}"."clients"("id") ON DELETE SET NULL`,
    );

    // --- Add address JSONB column to family_groups ---
    await queryRunner.query(
      `ALTER TABLE "${schema}"."family_groups" ADD COLUMN "address" jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const { schema } = queryRunner.connection
      .options as PostgresConnectionOptions;

    // --- Remove address from family_groups ---
    await queryRunner.query(
      `ALTER TABLE "${schema}"."family_groups" DROP COLUMN IF EXISTS "address"`,
    );

    // --- Remove tutor_id from clients ---
    await queryRunner.query(
      `ALTER TABLE "${schema}"."clients" DROP CONSTRAINT IF EXISTS "FK_clients_tutor"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."clients" DROP COLUMN IF EXISTS "tutor_id"`,
    );

    // --- Remove family_link CHECK constraint ---
    await queryRunner.query(
      `ALTER TABLE "${schema}"."clients" DROP CONSTRAINT IF EXISTS "CHK_clients_family_link"`,
    );

    // --- Restore original type CHECK constraint ---
    await queryRunner.query(
      `ALTER TABLE "${schema}"."clients" DROP CONSTRAINT IF EXISTS "CHK_clients_type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."clients" ADD CONSTRAINT "CHK_clients_type" CHECK (type IN ('particulier', 'passage', 'professionnel'))`,
    );

    // --- Remove is_minor column ---
    await queryRunner.query(
      `ALTER TABLE "${schema}"."clients" DROP COLUMN IF EXISTS "is_minor"`,
    );

    // --- Remove passager column ---
    await queryRunner.query(
      `ALTER TABLE "${schema}"."clients" DROP COLUMN IF EXISTS "passager"`,
    );
  }
}
