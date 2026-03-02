# Tasks: Bulk Stock Receipt

**Input**: Design documents from `/specs/002-bulk-stock-receipt/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: No explicit TDD/test-first requirement was requested in the feature spec, so test tasks are omitted from this list.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare endpoint scaffolding and DTO/module wiring for bulk stock receipt.

- [x] T001 Create bulk receipt request DTO file in src/apps/client/features/stock/dto/create-bulk-stock-receipt.dto.ts
- [x] T002 Export bulk receipt DTOs from src/apps/client/features/stock/dto/index.ts
- [x] T003 Add bulk receipt endpoint stub in src/apps/client/features/stock/stock.controller.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core schema and shared validation infrastructure required before all user stories.

**⚠️ CRITICAL**: No user story implementation should start until this phase is complete.

- [x] T004 [P] Add per-unit purchasePrice column/check to stock entry lines entity in libs/shared/src/entities/client/stock-entry-lines.client.entity.ts
- [x] T005 [P] Add per-unit purchasePrice column/check to stock items entity in libs/shared/src/entities/client/stock-items.client.entity.ts
- [x] T006 Add migration for purchasePrice columns and DB constraints in libs/shared/src/migrations/client/TIMESTAMP-migration.ts
- [x] T007 Add aggregated validation error type/shape for array+index reporting in src/apps/client/features/stock/dto/create-bulk-stock-receipt.dto.ts
- [x] T008 Add shared bulk validation helpers (duplicate pair detection, indexed error collector) in src/apps/client/features/stock/stock.service.ts

**Checkpoint**: Foundation ready — user stories can be implemented.

---

## Phase 3: User Story 1 - Receive Stock with New Products (Priority: P1) 🎯 MVP

**Goal**: Create products from `newProducts` and immediately create stock entry lines/items with per-unit purchase price.

**Independent Test**: Send a request with only `newProducts` and verify products are created, stock is filled, purchasePrice is persisted on line+item, and all data is grouped under one stock entry.

### Implementation for User Story 1

- [x] T009 [US1] Implement DTO validations for newProducts item payload (product creation + stock fill fields) in src/apps/client/features/stock/dto/create-bulk-stock-receipt.dto.ts
- [x] T010 [US1] Implement new-products creation flow inside bulk receipt service method in src/apps/client/features/stock/stock.service.ts
- [x] T011 [US1] Implement ProductSupplier creation for newProducts with optional productReferanceCode in src/apps/client/features/stock/stock.service.ts
- [x] T012 [US1] Persist stock entry lines for newProducts with purchasePrice in src/apps/client/features/stock/stock.service.ts
- [x] T013 [US1] Persist stock items/history for newProducts with purchasePrice copied per unit in src/apps/client/features/stock/stock.service.ts
- [x] T014 [US1] Wire controller bulk endpoint to service for newProducts-only requests in src/apps/client/features/stock/stock.controller.ts

**Checkpoint**: User Story 1 is independently functional.

---

## Phase 4: User Story 2 - Receive Stock for Existing Products (Priority: P1)

**Goal**: Fill stock for existing products using `existingProducts` without auto-creating missing ProductSupplier links.

**Independent Test**: Send a request with only `existingProducts` and verify stock lines/items are created with purchasePrice, duplicate (`productId`,`warehouseId`) pairs are rejected, and ProductSupplier links are not auto-created.

### Implementation for User Story 2

- [x] T015 [US2] Implement DTO validations for existingProducts item payload in src/apps/client/features/stock/dto/create-bulk-stock-receipt.dto.ts
- [x] T016 [US2] Implement duplicate pair validation for existingProducts (`productId` + `warehouseId`) in src/apps/client/features/stock/stock.service.ts
- [x] T017 [US2] Implement existing product and active warehouse reference validation in src/apps/client/features/stock/stock.service.ts
- [x] T018 [US2] Implement stock entry lines/items creation for existingProducts with purchasePrice in src/apps/client/features/stock/stock.service.ts
- [x] T019 [US2] Enforce no ProductSupplier auto-creation for existingProducts in src/apps/client/features/stock/stock.service.ts
- [x] T020 [US2] Return indexed aggregated validation errors for existingProducts failures in src/apps/client/features/stock/stock.service.ts

**Checkpoint**: User Story 2 is independently functional.

---

## Phase 5: User Story 3 - Mixed Receipt: New and Existing Products Together (Priority: P1)

**Goal**: Process mixed `newProducts` + `existingProducts` in one atomic transaction with unified response summary.

**Independent Test**: Send a mixed payload and verify one stock entry is created, both flows execute together, any failure rolls back all writes, and errors include array/index metadata.

### Implementation for User Story 3

- [x] T021 [US3] Implement unified transactional bulk receipt method combining both arrays in src/apps/client/features/stock/stock.service.ts
- [x] T022 [US3] Enforce request-level rule that both arrays cannot be empty in src/apps/client/features/stock/stock.service.ts
- [x] T023 [US3] Implement atomic rollback behavior for mixed-flow failures in src/apps/client/features/stock/stock.service.ts
- [x] T024 [US3] Implement success response summary counts/warnings payload in src/apps/client/features/stock/stock.service.ts
- [x] T025 [US3] Finalize POST /stock/bulk-receipt controller contract and Swagger docs in src/apps/client/features/stock/stock.controller.ts

**Checkpoint**: User Story 3 is independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Align docs/contracts and cleanups impacting multiple stories.

- [x] T026 [P] Sync endpoint contract with implemented request/response shape in specs/002-bulk-stock-receipt/contracts/bulk-stock-receipt.openapi.yaml
- [x] T027 [P] Sync usage and validation examples with final behavior in specs/002-bulk-stock-receipt/quickstart.md
- [x] T028 Remove debug logging and finalize controller response cleanliness in src/apps/client/features/stock/stock.controller.ts
- [x] T029 Update feature DTO exports and stock feature index exports if needed in src/apps/client/features/stock/dto/index.ts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Starts immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1 and blocks all user stories.
- **Phase 3 (US1)**: Depends on Phase 2.
- **Phase 4 (US2)**: Depends on Phase 2.
- **Phase 5 (US3)**: Depends on Phase 3 and Phase 4 completion.
- **Phase 6 (Polish)**: Depends on completed user stories.

### User Story Dependencies

- **US1**: Independent after foundational tasks.
- **US2**: Independent after foundational tasks.
- **US3**: Requires both US1 and US2 logic present because it combines both arrays in one transaction.

### Parallel Opportunities

- **Foundational**: T004 and T005 can run in parallel.
- **Polish**: T026 and T027 can run in parallel.
- **After Phase 2**: US1 and US2 can be worked on in parallel by different developers.

---

## Parallel Example: User Story 1

```bash
# Parallelizable only if split across team members after Phase 2:
Task T009  # DTO validation for newProducts
Task T014  # Controller wiring (can begin once DTO contract is stable)
```

## Parallel Example: User Story 2

```bash
# Parallelizable after service helper baseline exists:
Task T016  # Duplicate pair validation
Task T017  # Reference validation
```

## Parallel Example: User Story 3

```bash
# Mostly sequential in one service file; no safe heavy parallel split recommended.
Task T021 -> T022 -> T023 -> T024 -> T025
```

---

## Implementation Strategy

### MVP First (US1)

1. Complete Setup + Foundational phases.
2. Complete Phase 3 (US1) only.
3. Validate US1 independently with `newProducts`-only payload.
4. Demo/deploy MVP increment.

### Incremental Delivery

1. Deliver US1 (new product + fill).
2. Deliver US2 (existing product fill).
3. Deliver US3 (mixed transactional flow).
4. Apply polish tasks and docs synchronization.

### Parallel Team Strategy

1. Team aligns on Phase 1 + Phase 2 together.
2. Developer A implements US1 while Developer B implements US2.
3. Developer C integrates US3 and final response/error behavior.
4. Finish with cross-cutting polish tasks.
