<!--
  SYNC IMPACT REPORT
  ==================
  Version change: 1.0.0 → 1.1.0
  Bump rationale: MINOR — new principle added (IX. Domain Modeling
                  & Flexible Data) to codify guidance on polymorphic
                  entities, discriminated unions, and JSON/JSONB
                  open-schema columns introduced by the Clients
                  feature.

  Modified principles:
    - (unchanged) I. Architecture & Domain-Driven Design
    - (unchanged) II. Multi-Tenancy Isolation (HARD INVARIANT)
    - (unchanged) III. Security by Default
    - (unchanged) IV. Database & Data Consistency
    - (unchanged) V. TypeScript & Code Quality
    - (unchanged) VI. Testing & Quality Gates
    - (unchanged) VII. Observability & Operations
    - (unchanged) VIII. API Standards
    - (new) IX. Domain Modeling & Flexible Data

  Added sections: none (principle added within Core Principles)

  Removed sections: none

  Templates requiring updates:
    - .specify/templates/plan-template.md        ✅ compatible
      (Constitution Check section is dynamic)
    - .specify/templates/spec-template.md         ✅ compatible
      (no constitution-specific tokens)
    - .specify/templates/tasks-template.md        ✅ compatible
      (task categorisation is project-driven)
    - .specify/templates/checklist-template.md    ✅ compatible

  Follow-up TODOs: none
-->

# OptiSaaS API Constitution

## Technology Context

| Attribute       | Value                               |
| --------------- | ----------------------------------- |
| Runtime         | Node.js · TypeScript (strict mode)  |
| Framework       | NestJS 11                           |
| ORM             | TypeORM                             |
| Database        | PostgreSQL (multi-schema tenancy)   |
| Validation      | class-validator · class-transformer |
| Auth            | Passport · JWT                      |
| Package Manager | pnpm                                |

## Core Principles

### I. Architecture & Domain-Driven Design

- Every request MUST flow through clearly separated layers:
  **Controller → Use-Case / Service → Repository → Domain**.
- Controllers handle transport concerns only: HTTP method routing,
  DTO mapping, and response formatting. Controllers MUST NOT contain
  business logic, database queries, or domain decisions.
- Business rules and orchestration MUST live in use-cases or domain
  services. A use-case is the single entry point for a business
  operation.
- Repositories are the sole gateway to persistence. They MUST NOT
  contain business logic, validation, or authorization checks.
- Domain entities and value objects MUST be framework-agnostic: no
  dependency on NestJS decorators, HTTP concepts, or TypeORM in the
  domain layer.
- Modules MUST be cohesive and represent a bounded context. A module
  MUST NOT silently mutate state owned by another module.
- Cross-module communication MUST use explicit, documented interfaces
  (exported services or domain events). Hidden side effects across
  module boundaries are forbidden.
- Shared code (`@lib/shared`) MUST contain only genuinely cross-cutting
  concerns (base classes, decorators, guards, filters, helpers). No
  feature-specific logic in shared libraries.

### II. Multi-Tenancy Isolation (HARD INVARIANT)

- Tenant isolation is a **non-negotiable invariant**. No code path
  may bypass it.
- Every inbound request MUST resolve a tenant context before reaching
  any service or repository layer. Requests without a valid tenant
  context MUST be rejected immediately.
- All data-access operations MUST be tenant-scoped by default. Queries
  that omit tenant scoping are considered security defects.
- Cross-tenant data access MUST require an explicit elevated context
  (e.g., a backoffice/owner guard) with documented justification.
  Cross-tenant reads and writes MUST be auditable.
- Background jobs, scheduled tasks, and event handlers MUST carry
  and enforce tenant context. Tenant context MUST NOT leak between
  job executions.
- Caching layers MUST include the tenant identifier in every cache
  key. A cache hit MUST never return data belonging to a different
  tenant.
- Database schemas, connection pools, or row-level filters MUST
  enforce tenant boundaries at the infrastructure level—application
  logic alone is insufficient.

### III. Security by Default

- Authorization is **deny-by-default**. Every endpoint MUST have an
  explicit authentication guard and an explicit authorization guard.
  Unauthenticated or unauthorized requests MUST be rejected.
- All inbound data MUST be validated through DTO validation pipes
  before reaching service logic. Raw request bodies MUST NOT be
  passed to services.
- Secrets, tokens, passwords, and sensitive personal data MUST never
  appear in logs, error responses, or stack traces.
- The principle of least privilege MUST be applied to database roles,
  infrastructure credentials, and service accounts. Application
  database users MUST NOT have DDL privileges in production.
- Password storage MUST use a strong adaptive hashing algorithm
  (bcrypt or equivalent). Plain-text or reversible password storage
  is forbidden.
- JWT tokens MUST have bounded expiration. Refresh token rotation
  MUST be enforced when refresh tokens are used.
- CORS, rate limiting, and request-size limits MUST be configured
  explicitly—framework defaults are not sufficient.

### IV. Database & Data Consistency

- All schema changes MUST go through versioned migration files.
  TypeORM `synchronize: true` is forbidden in production and staging
  environments.
- Database constraints (foreign keys, unique indexes, NOT NULL, CHECK
  constraints) MUST be enforced at the database level. Application-
  only validation is insufficient for data integrity.
- Multi-step operations that MUST be atomic MUST use explicit database
  transactions. Partial writes without rollback are considered bugs.
- N+1 query patterns are forbidden. Data access for collections MUST
  use eager loading, joins, or batch queries. Critical query paths
  MUST have supporting indexes.
- Financial operations and other critical write paths MUST be
  idempotent. Idempotency keys or equivalent mechanisms MUST be used
  to prevent duplicate processing.
- Migration files MUST be reviewed for correctness, reversibility,
  and performance impact before merge. Destructive migrations (column
  drops, table drops) MUST include a rollback strategy.

### V. TypeScript & Code Quality

- The project MUST use strict TypeScript configuration:
  `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`.
  These flags MUST NOT be disabled.
- `any` types are forbidden except when interfacing with untyped
  third-party libraries, and each usage MUST include a justifying
  comment.
- Unsafe type casts (`as unknown as T`, non-null assertions `!`)
  MUST be avoided. When unavoidable, they MUST be isolated and
  commented.
- Errors MUST NOT be silently swallowed. Every `catch` block MUST
  either re-throw, transform into a domain exception, or log at an
  appropriate level with context.
- Application configuration MUST be validated at startup. Missing or
  invalid environment variables MUST cause immediate process
  termination with a clear error message.
- Functions SHOULD be small, pure where possible, and have
  predictable behavior. Side effects MUST be explicit and documented.
- Temporary workarounds, TODO hacks, and dead code MUST NOT be
  merged into production branches. If a workaround is necessary, it
  MUST be tracked in an issue and wrapped in a clearly marked
  deprecation path.

### VI. Testing & Quality Gates

- Unit tests are REQUIRED for all domain logic, value objects, and
  critical service methods. Domain tests MUST NOT depend on the
  framework, database, or external services.
- Integration tests are REQUIRED for main API flows, data access
  layers, and cross-module interactions. Integration tests MUST use
  a real database (not mocks) for data-access validation.
- Every bug fix MUST include a regression test that reproduces the
  original failure before the fix is applied.
- CI pipelines MUST enforce the following gates before merge:
  linting (`eslint`), type-checking (`tsc --noEmit`), and all test
  suites passing.
- Critical flows—financial operations, permission checks, tenant
  isolation, and sensitive data handling—MUST have thorough test
  coverage. These flows MUST NOT be merged without tests.
- Test data MUST be isolated per test run. Tests MUST NOT depend on
  shared mutable state or execution order.

### VII. Observability & Operations

- All log output MUST be structured (JSON format) and MUST include
  a correlation ID / request ID for traceability across services.
- Health-check endpoints MUST verify real dependency connectivity
  (database, cache, external services). A health check that always
  returns OK is not acceptable.
- Key operational metrics MUST be tracked: request latency (p50,
  p95, p99), error rates by endpoint, and database query duration.
- Key business events (user registration, subscription changes,
  payment processing) MUST be instrumented for monitoring and
  alerting.
- All outbound HTTP calls and external service integrations MUST
  have explicit timeouts configured. Default infinite timeouts are
  forbidden.
- Retry policies for transient failures MUST use exponential backoff
  with jitter. Retries MUST be bounded (max attempts) and MUST NOT
  retry non-idempotent operations without safeguards.

### VIII. API Standards

- All REST endpoints MUST follow consistent conventions: resource-
  oriented URLs, standard HTTP methods (GET, POST, PUT, PATCH,
  DELETE), and appropriate status codes.
- Error responses MUST use a standardized envelope format with at
  minimum: `statusCode`, `message`, and `error` fields. Error
  formats MUST NOT change between releases without versioning.
- All endpoints MUST be documented via Swagger/OpenAPI decorators.
  Undocumented endpoints MUST NOT be deployed to production.
- Breaking API changes (field removal, type changes, semantic
  changes) MUST follow a versioning strategy. Clients MUST be given
  a documented migration path and a deprecation period before
  removal.
- Pagination MUST be implemented for all list endpoints that can
  return unbounded result sets. Unpaginated collection endpoints
  are forbidden for user-facing data.
- Request and response DTOs MUST be explicitly defined. Controllers
  MUST NOT return raw entity objects to API consumers.

### IX. Domain Modeling & Flexible Data

- **Polymorphic entities** that share a common base but diverge by
  type MUST use a discriminator column (e.g., `type`) stored as a
  database-level `CHECK` or `ENUM` constraint. The discriminator
  value MUST match the TypeScript discriminated-union literal type.
- Type-specific fields for a polymorphic entity MAY be stored in
  the same table (single-table inheritance) when the number of
  nullable type-specific columns is manageable. When type-specific
  complexity grows, dedicated child tables joined by foreign key
  are preferred.
- Type guard functions (e.g., `isClientParticulier(client)`) MUST
  be provided in the domain layer for every discriminated union.
  Downstream code MUST use these guards instead of raw string
  comparisons against the discriminator.
- **JSON/JSONB columns** are permitted for genuinely open-schema
  data where the field set is intentionally unstructured or
  user-defined (e.g., medical records, custom metadata, form
  responses). JSONB columns MUST NOT be used as a shortcut to
  avoid proper relational modeling for well-known, queryable
  fields.
- Data stored in JSONB columns MUST be validated at the application
  layer (DTO pipe or service) to guarantee the value is a valid
  JSON object. Beyond structural validity, the application MUST
  NOT enforce a rigid schema on intentionally open JSONB fields—
  the consuming UI or domain process owns field interpretation.
- JSONB columns MUST have a PostgreSQL `DEFAULT '{}'::jsonb` or
  `DEFAULT 'null'` and MUST NOT be left without a default when
  the column is nullable.
- Queries that filter or sort on JSONB sub-paths in production
  workloads MUST be backed by a GIN index or an expression index
  on the relevant path.
- **Nested child entities** (e.g., conventions, internal contacts)
  that have independent identity MUST be modeled as separate
  tables with proper foreign keys—not embedded inside a parent
  JSONB column. One-to-many children MUST use a junction or
  child table with cascading delete/update rules defined at the
  database level.
- Value objects without independent identity (e.g., an address
  block reused across entities) MAY be stored as JSONB if they
  are always read/written as a whole and never queried
  independently.

## Enforcement & Compliance

- This constitution is the highest-authority engineering document for
  the OptiSaaS API project. It supersedes informal practices,
  verbal agreements, and individual preferences.
- All pull requests MUST be reviewed against these principles.
  Reviewers MUST reject code that violates a MUST-level rule unless
  an explicit, time-bound exception is documented and tracked.
- Automated enforcement MUST be used wherever possible: ESLint rules,
  TypeScript compiler flags, CI gates, and architectural fitness
  functions.
- Exceptions to any principle MUST be documented in the PR
  description with: (a) which principle is violated, (b) why the
  violation is necessary, (c) a remediation plan with a deadline.
- Periodic compliance reviews (at least quarterly) SHOULD be
  conducted to identify drift from constitutional principles.

## Governance

- **Amendment process**: Any team member may propose an amendment.
  Amendments MUST be submitted as a PR modifying this file, reviewed
  by at least one other engineer, and approved before merge.
- **Versioning policy**: This constitution follows semantic versioning.
  MAJOR: principle removal or backward-incompatible redefinition.
  MINOR: new principle or material expansion. PATCH: clarification,
  wording, or typo fix.
- **Compliance review**: The constitution MUST be reviewed when a new
  module is introduced, when the architecture changes materially, or
  at least once per quarter.
- **Conflict resolution**: If a specification or implementation plan
  conflicts with this constitution, the constitution prevails. The
  plan MUST be revised to comply, or an amendment MUST be proposed.

**Version**: 1.1.0 | **Ratified**: 2026-03-01 | **Last Amended**: 2026-03-04
