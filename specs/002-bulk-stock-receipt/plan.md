# Implementation Plan: Bulk Stock Receipt

**Branch**: `002-bulk-stock-receipt` | **Date**: 2026-03-01 | **Spec**: `/specs/002-bulk-stock-receipt/spec.md`
**Input**: Feature specification from `/specs/002-bulk-stock-receipt/spec.md`

## Summary

Extend the stock entry flow with a new bulk receipt endpoint that accepts a supplier and two arrays in a single atomic operation: one array creates new products and fills stock, while the second fills stock for existing products. Each request item carries per-unit `purchasePrice` persisted on both stock entry lines and stock items, duplicate `existingProducts` pairs (`productId + warehouseId`) are rejected, and validation failures return an aggregated indexed error list (`array`, `index`, field/message details).

## Technical Context

**Language/Version**: TypeScript 5.7 (strict) on Node.js  
**Primary Dependencies**: NestJS 11, TypeORM 0.3.x, class-validator, class-transformer, Swagger  
**Storage**: PostgreSQL (multi-schema tenancy, schema-per-tenant)  
**Testing**: Jest (unit + integration/e2e)  
**Target Platform**: Linux containerized API backend (Docker)  
**Project Type**: Multi-tenant REST web-service backend  
**Performance Goals**: Process up to 50 combined lines per request within existing API latency budgets; return complete aggregated validation results in one response  
**Constraints**: Tenant isolation hard invariant, transactional atomicity, non-idempotent behavior in MVP by explicit product decision, aggregated validation errors with array/index metadata  
**Scale/Scope**: One new endpoint and DTO set in client stock feature; schema update for per-unit `purchasePrice` storage on `stock_entry_lines` and `stock_items`; integration tests for mixed payload success/failure

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Pre-Phase 0 Gate Review

- **I. Architecture & DDD**: PASS — implementation remains in client stock bounded context with controller/service/repository separation.
- **II. Multi-Tenancy Isolation**: PASS — all reads/writes scoped through tenant context and `TenantRepositoryFactory` transactional access.
- **III. Security by Default**: PASS — endpoint remains guarded with existing auth/authorization; DTO validation required before service logic.
- **IV. Database & Data Consistency**: PASS WITH EXCEPTION — transactional integrity and constraints are preserved, but requirement FR-022 explicitly allows non-idempotent retries for MVP. Exception is accepted as a time-bound product decision and must be revisited in a future feature.
- **V. TypeScript & Code Quality**: PASS — strict DTO typing and explicit validation errors per array/index.
- **VI. Testing & Quality Gates**: PASS (planned) — regression tests for atomic rollback, duplicate rejection, and aggregated error reporting.
- **VII. Observability & Operations**: PASS (planned) — include structured logs for stock receipt action with supplier and line counts.
- **VIII. API Standards**: PASS — explicit request/response DTOs, standardized envelope, Swagger docs, and consistent REST routing.

### Post-Phase 1 Re-Check

- **Status**: PASS WITH EXCEPTION (unchanged)
- Design artifacts comply with constitutional principles except documented non-idempotent retry behavior approved by product scope.
- No unresolved `NEEDS CLARIFICATION` items remain.

## Project Structure

### Documentation (this feature)

```text
specs/002-bulk-stock-receipt/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── bulk-stock-receipt.openapi.yaml
└── tasks.md              # created later by /speckit.tasks
```

### Source Code (repository root)

```text
src/apps/client/features/stock/
├── dto/
│   ├── create-bulk-stock-receipt.dto.ts
│   └── index.ts
├── stock.controller.ts
├── stock.service.ts
└── stock.module.ts

libs/shared/src/entities/client/
├── stock-entry-lines.client.entity.ts   # add per-unit purchasePrice
├── stock-items.client.entity.ts          # add per-unit purchasePrice
└── index.ts                              # export updates if needed

libs/shared/src/migrations/client/
└── <timestamp>-add-purchase-price-to-stock-items-and-lines.ts

test/
└── stock-bulk-receipt.e2e-spec.ts
```

**Structure Decision**: Keep all changes within the existing client stock feature and shared client entities to preserve tenancy, auth guards, and migration conventions already used by feature 001.

## Complexity Tracking

- Violation: Constitution IV idempotency expectation on critical writes.
- Why needed: Product explicitly chose non-idempotent MVP behavior (FR-022) to ship faster without idempotency-key workflow changes.
- Simpler alternative rejected: Adding idempotency now requires cross-cutting request-key persistence, dedupe semantics, and retry reconciliation beyond current feature scope.
