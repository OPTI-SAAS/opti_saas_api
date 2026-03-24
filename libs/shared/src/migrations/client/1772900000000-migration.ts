import { MigrationInterface, QueryRunner } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export class RenameColumnsToEnglish1772900000000 implements MigrationInterface {
  name = 'RenameColumnsToEnglish1772900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const { schema } = queryRunner.connection
      .options as PostgresConnectionOptions;

    // --- clients: passager → walk_in ---
    await queryRunner.query(
      `ALTER TABLE "${schema}"."clients" RENAME COLUMN "passager" TO "walk_in"`,
    );

    // --- family_groups: nom → name ---
    await queryRunner.query(
      `ALTER TABLE "${schema}"."family_groups" RENAME COLUMN "nom" TO "name"`,
    );

    // --- conventions: rename French columns to English ---
    await queryRunner.query(
      `ALTER TABLE "${schema}"."conventions" RENAME COLUMN "numero" TO "number"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."conventions" RENAME COLUMN "date_debut" TO "start_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."conventions" RENAME COLUMN "date_fin" TO "end_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."conventions" RENAME COLUMN "taux_remise" TO "discount_rate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."conventions" RENAME COLUMN "plafond_credit" TO "credit_limit"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."conventions" RENAME COLUMN "delai_paiement" TO "payment_delay"`,
    );

    // --- conventions: update CHECK constraint to use new column names ---
    await queryRunner.query(
      `ALTER TABLE "${schema}"."conventions" DROP CONSTRAINT IF EXISTS "CHK_conventions_dates"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."conventions" ADD CONSTRAINT "CHK_conventions_dates" CHECK ("end_date" IS NULL OR "start_date" IS NULL OR "end_date" > "start_date")`,
    );

    // --- contacts_internes: rename French columns to English ---
    await queryRunner.query(
      `ALTER TABLE "${schema}"."contacts_internes" RENAME COLUMN "nom" TO "last_name"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."contacts_internes" RENAME COLUMN "prenom" TO "first_name"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."contacts_internes" RENAME COLUMN "fonction" TO "position"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."contacts_internes" RENAME COLUMN "telephone" TO "phone"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."contacts_internes" RENAME COLUMN "principal" TO "is_principal"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const { schema } = queryRunner.connection
      .options as PostgresConnectionOptions;

    // --- contacts_internes: revert to French ---
    await queryRunner.query(
      `ALTER TABLE "${schema}"."contacts_internes" RENAME COLUMN "is_principal" TO "principal"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."contacts_internes" RENAME COLUMN "phone" TO "telephone"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."contacts_internes" RENAME COLUMN "position" TO "fonction"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."contacts_internes" RENAME COLUMN "first_name" TO "prenom"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."contacts_internes" RENAME COLUMN "last_name" TO "nom"`,
    );

    // --- conventions: revert CHECK constraint ---
    await queryRunner.query(
      `ALTER TABLE "${schema}"."conventions" DROP CONSTRAINT IF EXISTS "CHK_conventions_dates"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."conventions" ADD CONSTRAINT "CHK_conventions_dates" CHECK ("date_fin" IS NULL OR "date_debut" IS NULL OR "date_fin" > "date_debut")`,
    );

    // --- conventions: revert to French ---
    await queryRunner.query(
      `ALTER TABLE "${schema}"."conventions" RENAME COLUMN "payment_delay" TO "delai_paiement"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."conventions" RENAME COLUMN "credit_limit" TO "plafond_credit"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."conventions" RENAME COLUMN "discount_rate" TO "taux_remise"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."conventions" RENAME COLUMN "end_date" TO "date_fin"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."conventions" RENAME COLUMN "start_date" TO "date_debut"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."conventions" RENAME COLUMN "number" TO "numero"`,
    );

    // --- family_groups: revert ---
    await queryRunner.query(
      `ALTER TABLE "${schema}"."family_groups" RENAME COLUMN "name" TO "nom"`,
    );

    // --- clients: revert ---
    await queryRunner.query(
      `ALTER TABLE "${schema}"."clients" RENAME COLUMN "walk_in" TO "passager"`,
    );
  }
}
