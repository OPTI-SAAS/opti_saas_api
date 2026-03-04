# Phase 0 Research: Client Management

## Decision 1: Manual discriminator column instead of TypeORM STI

- **Decision**: Use a single `ClClient` entity class with a manual `type` varchar column and nullable type-specific columns (single-table inheritance modeled manually).
- **Rationale**: No entity in the codebase uses TypeORM's `@TableInheritance()`/`@ChildEntity()`. The three client types share ~80% of columns. A single entity works cleanly with `TenantRepositoryFactory.executeInTransaction()` and `manager.getRepository(ClClient)`. Type-specific validation is handled at the DTO/service layer.
- **Alternatives considered**:
  - TypeORM STI (`@ChildEntity`) — rejected: zero precedent in the project, documented bugs with relations and discriminator querying in TypeORM 0.3.x, uncertain behavior inside tenant-scoped transaction managers.
  - Separate tables per client type — rejected: over-engineered for the amount of shared data; cross-type queries (list all clients) would require UNION or polymorphic views.

## Decision 2: VARCHAR column with CHECK constraint for discriminator

- **Decision**: Store `type` as `varchar` with a `@Check('CHK_clients_type', "type IN ('particulier', 'passage', 'professionnel')")` constraint.
- **Rationale**: Constitution IX requires a DB-level CHECK or ENUM for discriminators. The project already uses `@Check` for numeric constraints on stock items. CHECK is preferred over PostgreSQL `CREATE TYPE ... AS ENUM` because adding/removing values is simpler (ALTER TABLE vs non-transactional ALTER TYPE).
- **Alternatives considered**:
  - PostgreSQL ENUM type — rejected: adding values requires `ALTER TYPE ... ADD VALUE` (non-transactional before PG 12, no removal possible).
  - Plain varchar without constraint — rejected: violates Constitution IX requirement for DB-level enforcement.

## Decision 3: Open-schema JSONB column for medical records

- **Decision**: Define `medical_record` as `type: 'jsonb'` with `DEFAULT '{}'::jsonb`, typed as `Record<string, unknown>` in TypeScript. DTO validates it is a JSON object (`@IsObject()`) but does not enforce specific fields.
- **Rationale**: The spec explicitly requires open-schema medical records. Constitution IX permits JSONB for "genuinely open-schema data where the field set is intentionally unstructured." The UI owns field interpretation. This follows the existing `warehouses.address` JSONB pattern but adds a NOT NULL default.
- **Alternatives considered**:
  - Typed interface with explicit fields — rejected: user explicitly requested "do not specify the fields; JSON opened, accept any record."
  - Separate medical_records table — rejected: medical record has no independent identity (it's a value object always read/written with the client), and the spec requires whole-object replacement, not field-level updates.

## Decision 4: Explicit `active: boolean` column for deactivation

- **Decision**: Use a dedicated `active` boolean column (default `true`) for business-level deactivation, not the inherited `deletedAt` soft-delete column.
- **Rationale**: Matches the existing `ClWarehouse.active` pattern exactly. Semantics differ: `active=false` means "logically deactivated, still queryable with filter"; `deletedAt` means "soft-deleted, excluded by default from all TypeORM queries." The spec requires reactivation, which is awkward with `deletedAt` (set to null).
- **Alternatives considered**:
  - Using `deletedAt` for deactivation — rejected: TypeORM excludes soft-deleted rows by default, making "show inactive clients" queries cumbersome; reactivation reversal is not idiomatic.

## Decision 5: UUID primary keys, integer for familyGroupId

- **Decision**: All PKs remain UUID (inherited from `BaseEntity`). `familyGroupId` is an `integer` nullable column used as a logical grouping label, not a foreign key.
- **Rationale**: `BaseEntity` mandates UUID PKs. All infrastructure (tenant factory, guards, services) assumes UUID strings. The user's `id?: number` interface was early sketches; the implementation must use `id: string`. `familyGroupId` is not a PK or FK — it's a shared integer label that clusters related clients.
- **Alternatives considered**:
  - Integer PKs — rejected: would require replacing `BaseEntity`, breaking the entire entity inheritance chain.
  - Family group as a separate table with FK — rejected: over-engineered for a simple clustering label; no CRUD operations on family groups themselves beyond assigning members.

## Decision 6: Convention and ContactInterne as separate tables

- **Decision**: Model conventions and internal contacts as dedicated entities (`ClConvention`, `ClContactInterne`) with proper foreign keys to `ClClient`, not embedded in a JSONB column.
- **Rationale**: Constitution IX mandates that "nested child entities with independent identity MUST be modeled as separate tables with proper foreign keys." Conventions have CRUD lifecycle. Internal contacts have independent identity (name, function, principal flag).
- **Alternatives considered**:
  - JSONB columns on the client table — rejected: violates Constitution IX; conventions and contacts have independent identity and CRUD operations.

## Decision 7: Convention is one-to-one with cascading delete

- **Decision**: A professional client has at most one convention. The relationship uses `@OneToOne` with `CASCADE` on delete (when client is deleted, convention is deleted).
- **Rationale**: The spec states "a professional client can have at most one convention." Cascade delete is appropriate because a convention has no meaning without its parent client.
- **Alternatives considered**:
  - One-to-many conventions — rejected: spec explicitly limits to one convention per client.
  - No cascade (orphan conventions) — rejected: Constitution IV requires referential integrity at the DB level.

## Decision 8: Principal contact auto-unset via service logic

- **Decision**: When a new internal contact is marked as `principal = true`, the service layer unmarks any existing principal contact for that client in the same transaction.
- **Rationale**: The spec says "exactly one contact may be marked as principal at any time; setting a new principal automatically unmarks the previous one." This is a business rule best enforced in the service layer within a transaction.
- **Alternatives considered**:
  - Unique partial index on `(client_id) WHERE principal = true` — rejected: PostgreSQL partial unique indexes can cause race conditions without explicit transaction management; the service needs to actively unset the old principal regardless.
  - Database trigger — rejected: business logic in triggers violates Constitution I (business rules must live in services).

## Decision 9: ICE uniqueness enforced via unique index

- **Decision**: Add a unique index on `ice` column, scoped to the tenant schema. Only professional clients have ICE values; other client types store NULL in this column, and NULLs are excluded from unique constraints by default in PostgreSQL.
- **Rationale**: The spec requires ICE uniqueness per tenant. Schema-level isolation ensures tenant scoping. PostgreSQL's default behavior of excluding NULLs from unique indexes means particulier/passage clients (which have NULL ice) won't conflict.
- **Alternatives considered**:
  - Application-only uniqueness check — rejected: Constitution IV requires DB-level constraints.
  - Partial unique index `WHERE type = 'professionnel'` — considered but unnecessary since NULL values are already excluded from standard unique indexes.

## Decision 10: Search implementation with ILIKE

- **Decision**: Implement name/company search using PostgreSQL `ILIKE` with `%search%` pattern on `last_name`, `first_name`, and `company_name` columns. Add a composite index on `(type, active)` for filtered listing. Add individual indexes on `last_name` and `company_name` for search performance.
- **Rationale**: The spec requires case-insensitive partial matching. `ILIKE` is the simplest PostgreSQL approach and sufficient for 10,000 clients per tenant. The TypeORM `queryBuilder.where()` supports ILIKE natively.
- **Alternatives considered**:
  - Full-text search (`tsvector`) — rejected: over-engineered for simple name matching on a bounded dataset.
  - `pg_trgm` extension with GIN index — rejected: adds complexity; revisit if ILIKE performance degrades beyond 10K clients.

## Decision 11: Contract-first API definition via OpenAPI

- **Decision**: Produce an OpenAPI 3.0 contract in `contracts/` covering all client CRUD endpoints, convention management, and internal contact management.
- **Rationale**: The feature exposes external REST APIs and Constitution VIII requires Swagger/OpenAPI documentation. A contract-first approach aligns with the existing project pattern (spec 002 produced an OpenAPI file).
- **Alternatives considered**:
  - Swagger-only via NestJS decorators — rejected: contract should be defined before implementation for alignment.
