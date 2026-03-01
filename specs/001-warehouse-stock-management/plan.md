# Implementation Plan: Warehouse Stock Management

**Branch**: `001-warehouse-stock-management` | **Date**: 2026-03-01 | **Spec**: `/specs/001-warehouse-stock-management/spec.md`
**Input**: Feature specification from `/specs/001-warehouse-stock-management/spec.md`

## Summary

Implement tenant-isolated stock tracking at physical-unit level by introducing Stock Item, Stock Entry, and Stock Movement History models plus a new client API feature module for stock entry creation, warehouse stock views, stock transfer, write-off removal, and audit history queries. All write flows will be transactional via `TenantRepositoryFactory.executeInTransaction`, with append-only movement history, status lifecycle enforcement (`active`/`reserved`/`removed`), supplier + justification-file requirements on stock entry, and protection rules preventing product deletion / warehouse deactivation while active or reserved stock exists.

## Technical Context

**Language/Version**: TypeScript 5.7 (strict) on Node.js  
**Primary Dependencies**: NestJS 11, TypeORM 0.3.x, class-validator, class-transformer, Swagger  
**Storage**: PostgreSQL (multi-schema tenancy, schema-per-tenant)  
**Testing**: Jest (unit + integration/e2e patterns in repo)  
**Target Platform**: Linux containerized API service (Docker)  
**Project Type**: Multi-tenant REST web-service backend  
**Performance Goals**: Meet spec targets: stock/history queries <= 2s for up to 10k items per warehouse; stock addition UX <= 2 minutes; batch transfer UX <= 1 minute  
**Constraints**: Tenant isolation hard invariant; transactional atomicity for multi-line stock entries; immutable movement history; standardized response envelope and DTO validation on all endpoints  
**Scale/Scope**: Client app module scope, new stock feature with 4 new entities (including entry lines), 6-8 REST endpoints, migration + integration coverage for critical flows

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Pre-Phase 0 Gate Review

- **I. Architecture & DDD**: PASS — new bounded context module `stock` with controller/service split; no feature logic in shared cross-cutting packages.
- **II. Multi-Tenancy Isolation**: PASS — all data access through `TenantRepositoryFactory` transactions with tenant context middleware already enforced in `ClientModule`.
- **III. Security by Default**: PASS (with explicit plan item) — endpoints guarded with `JwtAuthGuard` and tenant header; authorization matrix documented in contracts and quickstart.
- **IV. Database & Data Consistency**: PASS — schema changes via migration; FK/unique/check constraints included; multi-step writes atomic in single transaction.
- **V. TypeScript & Code Quality**: PASS — strict DTOs/types, no `any`, use existing patterns.
- **VI. Testing & Quality Gates**: PASS (planned) — add integration tests for create/move/remove/history and regression checks for blocking product delete/warehouse deactivation.
- **VII. Observability & Operations**: PASS (planned) — business events mapped in movement history and structured logs with tenant/action metadata.
- **VIII. API Standards**: PASS — resource-oriented routes, pagination for list endpoints, explicit request/response DTO contracts, Swagger annotations.

### Post-Phase 1 Re-Check

- **Status**: PASS
- No constitution violations introduced by design artifacts.
- No unresolved `NEEDS CLARIFICATION` items remain.

## Project Structure

### Documentation (this feature)

```text
specs/001-warehouse-stock-management/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── stock-api.openapi.yaml
└── tasks.md              # created later by /speckit.tasks
```

### Source Code (repository root)

```text
libs/shared/src/
├── entities/client/
│   ├── stock-entries.client.entity.ts
│   ├── stock-entry-lines.client.entity.ts
│   ├── stock-items.client.entity.ts
│   ├── stock-movement-history.client.entity.ts
│   └── index.ts                        # export new entities
└── enums/client/
    ├── stock.client.enum.ts
    └── index.ts                        # export new enums

src/apps/client/
├── client.module.ts                    # register StockModule
└── features/stock/
    ├── dto/
    │   ├── create-stock-entry.dto.ts
    │   ├── move-stock-items.dto.ts
    │   ├── remove-stock-items.dto.ts
    │   └── index.ts
    ├── stock.controller.ts
    ├── stock.service.ts
    ├── stock.module.ts
    └── index.ts

libs/shared/src/migrations/client/
└── <timestamp>-migration.ts            # generated migration for stock tables/constraints/indexes

test/
└── stock.e2e-spec.ts                   # new e2e/integration flow coverage
```

**Structure Decision**: Keep implementation inside existing client backend architecture (`libs/shared` for entities/enums and `src/apps/client/features` for feature logic) to maximize consistency with current modules (products, suppliers, warehouses) and preserve tenancy + auth pipeline.

## Complexity Tracking

No constitution violations require exceptions. Complexity remains within one feature module and one migration set.
