# Phase 0 Research: Warehouse Stock Management

## Decision 1: Track stock at item level with separate Stock Entry grouping

- **Decision**: Model physical inventory as individual `Stock Item` records and group additions under `Stock Entry` + `Stock Entry Line`.
- **Rationale**: The spec requires per-item movement traceability, immutable audit history, and bulk additions across products/warehouses in one action. A grouped entry preserves business context (supplier + file) while item-level rows preserve transfer/remove granularity.
- **Alternatives considered**:
  - Aggregate quantity table only (`product_id`, `warehouse_id`, `qty`) — rejected: cannot provide item-level chronological movement trace.
  - Item-level only without Stock Entry entity — rejected: cannot represent one business action spanning multiple products/warehouses and a shared justification file/supplier.

## Decision 2: Add `Stock Entry Line` as explicit entity (not JSON blob)

- **Decision**: Persist lines in relational table `stock_entry_lines`.
- **Rationale**: Enables FK constraints (`product`, `warehouse`, `stock_entry`), queryability, and clean validation for quantity > 0. This matches TypeORM + migration conventions and avoids opaque JSON validation.
- **Alternatives considered**:
  - JSONB line array inside `stock_entries` — rejected: weaker relational integrity and harder filtering/reporting.

## Decision 3: Movement history remains append-only with event-type semantics

- **Decision**: Use `stock_movement_history` with `movementType` (`addition`, `transfer`, `removal`) and nullable `fromWarehouseId`, `toWarehouseId`, `removalReason`, `stockEntryId` as context attributes.
- **Rationale**: Captures all required scenarios from FR-007/008/008c and keeps writes immutable by design (insert-only from service methods; no update/delete endpoints).
- **Alternatives considered**:
  - Overloading stock item `updatedAt` as history — rejected: loses event details and actor metadata.
  - Separate tables per event type — rejected: increases query complexity for unified timeline reads.

## Decision 4: Use transactional write model for create/move/remove

- **Decision**: Execute stock entry creation, transfer, and removal in `TenantRepositoryFactory.executeInTransaction`.
- **Rationale**: Constitution IV mandates atomicity for multi-step operations and prevents partial writes (especially multi-line stock entry creation).
- **Alternatives considered**:
  - Best-effort writes with per-item commits — rejected: violates data consistency and can produce history/item divergence.

## Decision 5: Keep tenant isolation fully inherited from existing client pipeline

- **Decision**: No custom tenant bypasses; use existing tenant middleware + tenant repository factory only.
- **Rationale**: Constitution II hard invariant and existing module patterns already enforce schema-scoped transactions.
- **Alternatives considered**:
  - Direct global DataSource usage — rejected: high risk of cross-tenant leakage.

## Decision 6: API contract shape and pagination strategy

- **Decision**: Resource endpoints under `/client/stock/*`; list/history endpoints must support pagination; request/response DTOs explicit with Swagger.
- **Rationale**: Constitution VIII requires consistent REST conventions, pagination for unbounded collections, and explicit DTO documentation.
- **Alternatives considered**:
  - Single RPC-like endpoint for all actions — rejected: weak API clarity and poor documentation discoverability.

## Decision 7: Warehouse capacity handling remains advisory warning

- **Decision**: Return warnings when additions exceed configured capacity but do not hard block.
- **Rationale**: Directly matches clarified spec assumption and acceptance scenario.
- **Alternatives considered**:
  - Hard block when capacity exceeded — rejected: conflicts with accepted product behavior.

## Decision 8: Reservation lifecycle handling in implementation scope

- **Decision**: Persist `Stock Item` status enum including `reserved`, but implement state transitions required for this feature (`active -> removed`, `active -> moved`) and enforce that only `active` can move/remove.
- **Rationale**: Current feature stories center on addition/move/remove/history. Reservation full workflow can be incremental while schema remains compatible.
- **Alternatives considered**:
  - Exclude `reserved` from model now — rejected: contradicts clarified lifecycle and deletion/deactivation rules.
  - Fully implement reserve/release endpoints in this increment — deferred to keep scope aligned with current stories.

## Decision 9: Referential integrity and deletion guards

- **Decision**: Use restrictive FKs for product/warehouse/supplier/file references in stock tables and enforce FR-014/FR-015 checks in service layer before product deletion or warehouse deactivation.
- **Rationale**: Combines DB-level integrity with business-level lifecycle rules based on statuses (`active`/`reserved` block).
- **Alternatives considered**:
  - Cascade deletes from products/warehouses — rejected: would destroy auditability and violate business rules.

## Decision 10: File constraints and validation source of truth

- **Decision**: Reuse existing files flow (`request-upload-url` + stored `ClFile` record reference) and validate file existence/type/size against existing File metadata and configured policy.
- **Rationale**: Avoids duplicate upload flows and keeps constraints centralized.
- **Alternatives considered**:
  - Embed binary upload into stock endpoint — rejected: inconsistent with current architecture.

## Resolved Clarifications Summary

All technical context uncertainties are resolved for planning:

- Data model includes explicit `Stock Entry Line` normalization.
- Atomic transaction boundary defined for all write commands.
- Tenant isolation strategy is existing middleware + repository factory, no bypasses.
- API style follows current client feature conventions.
- Migration strategy is standard client migration with schema placeholder support.
