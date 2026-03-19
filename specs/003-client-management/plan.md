# Implementation Plan: Client Management

**Branch**: `003-client-management` | **Date**: 2026-03-04 | **Spec**: `/specs/003-client-management/spec.md`
**Input**: Feature specification from `/specs/003-client-management/spec.md`

## Summary

Introduce a full Client Management module supporting three mutually exclusive client types — particulier (individual), passage (walk-in), and professionnel (business) — stored in a single polymorphic table with a manual discriminator and CHECK constraint. Professional clients may have one convention (one-to-one) and multiple internal contacts (one-to-many), each modeled as separate entities. Open-schema medical records are stored as JSONB. The module exposes CRUD endpoints for clients, convention upsert/delete, and internal contact management, with ILIKE-based search, pagination, and an explicit `active` boolean for deactivation/reactivation.

## Technical Context

**Language/Version**: TypeScript 5.7 (strict) on Node.js  
**Primary Dependencies**: NestJS 11, TypeORM 0.3.20, class-validator, class-transformer, Swagger  
**Storage**: PostgreSQL (multi-schema tenancy, schema-per-tenant)  
**Testing**: Jest (unit + integration/e2e)  
**Target Platform**: Linux containerized API backend (Docker)  
**Project Type**: Multi-tenant REST web-service backend  
**Performance Goals**: Support up to 10,000 clients per tenant; list/search responses within standard API latency budgets  
**Constraints**: Tenant isolation hard invariant, transactional atomicity via `TenantRepositoryFactory.executeInTransaction()`, type immutability after creation, open-schema JSONB for medical records  
**Scale/Scope**: New feature module with 3 entities (ClClient, ClConvention, ClContactInterne), one controller, one service, one migration, ~10 REST endpoints

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Pre-Phase 0 Gate Review

- **I. Architecture & DDD**: PASS — new standalone bounded context in client features with controller/service/repository separation. No cross-module mutations.
- **II. Multi-Tenancy Isolation**: PASS — all data access scoped through `TenantRepositoryFactory.executeInTransaction()`. Entities auto-discovered in tenant schema. Migration uses `${schema}` interpolation.
- **III. Security by Default**: PASS — endpoints guarded with `@UseGuards(JwtAuthGuard)`, `@ApiBearerAuth`, `@TenantApiHeader()`. All input validated through DTO pipes before reaching service.
- **IV. Database & Data Consistency**: PASS — CHECK constraint on discriminator, UNIQUE on ICE, FK constraints on convention/contacts with CASCADE, migration-based schema changes, transactional operations.
- **V. TypeScript & Code Quality**: PASS — strict typing with const enums (`ExtractEnumTypes`), type guards for discriminated union, no `any` usage.
- **VI. Testing & Quality Gates**: PASS (planned) — unit tests for type guards and validation, integration tests for CRUD flows, edge cases (duplicate ICE, principal contact swap, type immutability).
- **VII. Observability & Operations**: PASS (planned) — structured logging for client creation/deactivation/reactivation events.
- **VIII. API Standards**: PASS — OpenAPI contract defined, standardized error envelope, pagination on list endpoint, explicit request/response DTOs.
- **IX. Domain Modeling & Flexible Data**: PASS — discriminator with CHECK constraint, type guards provided, JSONB for open-schema medical records with `DEFAULT '{}'::jsonb`, convention/contacts as separate tables per constitution mandate.

### Post-Phase 1 Re-Check

- **Status**: PASS (all principles satisfied)
- Design artifacts comply with all nine constitutional principles. No violations to justify.
- No unresolved `NEEDS CLARIFICATION` items remain in research.md.

## Project Structure

### Documentation (this feature)

```text
specs/003-client-management/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── client-management.openapi.yaml
├── checklists/
│   └── requirements.md
└── tasks.md              # created later by /speckit.tasks
```

### Source Code (repository root)

```text
src/apps/client/features/clients/
├── index.ts
├── clients.controller.ts
├── clients.helper.ts                     # utility functions (serialization, validation, entity mapping)
├── clients.module.ts
├── clients.service.ts
├── dto/
│   ├── index.ts
│   ├── client-response.dto.ts            # all response DTOs (base, particulier, professionnel, family, convention, contact, pagination)
│   ├── contact-interne.dto.ts
│   ├── convention.dto.ts
│   ├── create-client.dto.ts
│   ├── create-client-base.dto.ts         # base creation DTO with conditional validation per type
│   ├── create-sponsor-payload.dto.ts
│   ├── create-tutor-payload.dto.ts
│   ├── family-group.dto.ts
│   ├── query-clients.dto.ts
│   ├── query-family-groups.dto.ts
│   ├── query-family-search.dto.ts        # family search by address/phone/name (dead code — not wired to controller)
│   └── update-client.dto.ts
└── pipes/
    └── create-client-validation.pipe.ts  # custom validation pipe for type-conditional fields

libs/shared/src/entities/client/
├── clients.client.entity.ts
├── conventions.client.entity.ts
├── contacts-internes.client.entity.ts
├── family-groups.client.entity.ts        # ClFamilyGroup entity (nom, address JSONB, notes, members)
└── index.ts                              # updated with new exports

libs/shared/src/enums/client/
└── client.client.enum.ts                 # types re-exported from @optisaas/opti-saas-lib + local constants/type guards

libs/shared/src/migrations/client/
└── <timestamp>-create-clients-conventions-contacts-internes.ts

test/
└── clients.e2e-spec.ts
```

**Structure Decision**: Follow the existing feature module pattern established by features 001 and 002. All client-scoped feature code lives under `src/apps/client/features/clients/`, shared entities under `libs/shared/src/entities/client/`, and enums under `libs/shared/src/enums/client/`. The module is registered in `src/apps/client/client.module.ts`.

## Complexity Tracking

> No constitution violations detected. All design decisions comply with the nine principles.
