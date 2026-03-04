import { MigrationInterface, QueryRunner } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export class CreateClientsConventionsContactsInternes1772700000000 implements MigrationInterface {
  name = 'CreateClientsConventionsContactsInternes1772700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const { schema } = queryRunner.connection
      .options as PostgresConnectionOptions;

    // --- clients table ---
    await queryRunner.query(
      `CREATE TABLE "${schema}"."clients" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "type" character varying NOT NULL,
        "phone" character varying,
        "email" character varying,
        "city" character varying,
        "address" character varying,
        "active" boolean NOT NULL DEFAULT true,
        "title" character varying,
        "last_name" character varying,
        "first_name" character varying,
        "birth_date" date,
        "sponsor_id" uuid,
        "spouse_name" character varying,
        "id_document_type" character varying,
        "id_document_number" character varying,
        "family_group_id" integer,
        "family_link" character varying,
        "is_optical_beneficiary" boolean,
        "is_financial_responsible" boolean,
        "has_shared_mutual" boolean,
        "has_shared_address" boolean,
        "has_social_coverage" boolean,
        "coverage_type" character varying,
        "membership_number" character varying,
        "medical_record" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "notes" text,
        "company_name" character varying,
        "tax_id" character varying,
        "ice" character varying,
        "commercial_register" character varying,
        "trade_license" character varying,
        "vat_exempt" boolean,
        CONSTRAINT "PK_clients" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_clients_type" CHECK (type IN ('particulier', 'passage', 'professionnel'))
      )`,
    );

    // Self-referential FK for sponsor
    await queryRunner.query(
      `ALTER TABLE "${schema}"."clients" ADD CONSTRAINT "FK_clients_sponsor" FOREIGN KEY ("sponsor_id") REFERENCES "${schema}"."clients"("id") ON DELETE SET NULL`,
    );

    // Indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_clients_type_active" ON "${schema}"."clients" ("type", "active")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_clients_last_name" ON "${schema}"."clients" ("last_name")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_clients_company_name" ON "${schema}"."clients" ("company_name")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_clients_family_group" ON "${schema}"."clients" ("family_group_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_clients_ice" ON "${schema}"."clients" ("ice") WHERE "ice" IS NOT NULL`,
    );

    // --- conventions table ---
    await queryRunner.query(
      `CREATE TABLE "${schema}"."conventions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "client_id" uuid NOT NULL,
        "numero" character varying NOT NULL,
        "date_debut" date,
        "date_fin" date,
        "taux_remise" decimal(5,2) NOT NULL DEFAULT 0,
        "plafond_credit" decimal(12,2) NOT NULL DEFAULT 0,
        "delai_paiement" integer NOT NULL DEFAULT 0,
        "notes" text,
        CONSTRAINT "PK_conventions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_conventions_client_id" UNIQUE ("client_id"),
        CONSTRAINT "CHK_conventions_dates" CHECK (date_fin IS NULL OR date_debut IS NULL OR date_fin > date_debut)
      )`,
    );

    await queryRunner.query(
      `ALTER TABLE "${schema}"."conventions" ADD CONSTRAINT "FK_conventions_client" FOREIGN KEY ("client_id") REFERENCES "${schema}"."clients"("id") ON DELETE CASCADE`,
    );

    // --- contacts_internes table ---
    await queryRunner.query(
      `CREATE TABLE "${schema}"."contacts_internes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "client_id" uuid NOT NULL,
        "nom" character varying NOT NULL,
        "prenom" character varying NOT NULL,
        "fonction" character varying NOT NULL,
        "telephone" character varying NOT NULL,
        "email" character varying NOT NULL,
        "principal" boolean NOT NULL DEFAULT false,
        CONSTRAINT "PK_contacts_internes" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_contacts_internes_client" ON "${schema}"."contacts_internes" ("client_id")`,
    );

    await queryRunner.query(
      `ALTER TABLE "${schema}"."contacts_internes" ADD CONSTRAINT "FK_contacts_internes_client" FOREIGN KEY ("client_id") REFERENCES "${schema}"."clients"("id") ON DELETE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const { schema } = queryRunner.connection
      .options as PostgresConnectionOptions;

    // Drop contacts_internes
    await queryRunner.query(
      `ALTER TABLE "${schema}"."contacts_internes" DROP CONSTRAINT "FK_contacts_internes_client"`,
    );
    await queryRunner.query(
      `DROP INDEX "${schema}"."IDX_contacts_internes_client"`,
    );
    await queryRunner.query(`DROP TABLE "${schema}"."contacts_internes"`);

    // Drop conventions
    await queryRunner.query(
      `ALTER TABLE "${schema}"."conventions" DROP CONSTRAINT "FK_conventions_client"`,
    );
    await queryRunner.query(`DROP TABLE "${schema}"."conventions"`);

    // Drop clients
    await queryRunner.query(`DROP INDEX "${schema}"."UQ_clients_ice"`);
    await queryRunner.query(
      `DROP INDEX "${schema}"."IDX_clients_family_group"`,
    );
    await queryRunner.query(
      `DROP INDEX "${schema}"."IDX_clients_company_name"`,
    );
    await queryRunner.query(`DROP INDEX "${schema}"."IDX_clients_last_name"`);
    await queryRunner.query(`DROP INDEX "${schema}"."IDX_clients_type_active"`);
    await queryRunner.query(
      `ALTER TABLE "${schema}"."clients" DROP CONSTRAINT "FK_clients_sponsor"`,
    );
    await queryRunner.query(`DROP TABLE "${schema}"."clients"`);
  }
}
