# Tasks: Warehouse Stock Management

**Input**: Design documents from `/specs/001-warehouse-stock-management/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/stock-api.openapi.yaml, quickstart.md

**Tests**: Included (spec has mandatory testing scenarios and constitution requires integration coverage for critical flows).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (`[US1]`..`[US5]`)
- Every task includes an exact file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create stock feature scaffolding and shared enums

- [x] T001 Create stock feature module scaffold in `src/apps/client/features/stock/`
- [x] T002 [P] Create stock DTO barrel scaffold in `src/apps/client/features/stock/dto/index.ts`
- [x] T003 [P] Create stock enum definitions in `libs/shared/src/enums/client/stock.client.enum.ts`
- [x] T004 Export stock enums in `libs/shared/src/enums/client/index.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build core persistence and wiring required by all stories

**⚠️ CRITICAL**: No user story work starts before this phase is complete

- [x] T005 Create StockEntry entity in `libs/shared/src/entities/client/stock-entries.client.entity.ts`
- [x] T006 [P] Create StockEntryLine entity in `libs/shared/src/entities/client/stock-entry-lines.client.entity.ts`
- [x] T007 [P] Create StockItem entity in `libs/shared/src/entities/client/stock-items.client.entity.ts`
- [x] T008 [P] Create StockMovementHistory entity in `libs/shared/src/entities/client/stock-movement-history.client.entity.ts`
- [x] T009 Export stock entities in `libs/shared/src/entities/client/index.ts`
- [x] T010 Add stock module wiring in `src/apps/client/features/stock/stock.module.ts`
- [x] T011 Register StockModule in `src/apps/client/client.module.ts`
- [x] T012 Create base stock service utilities (tenant repositories, relation validators, helper methods) in `src/apps/client/features/stock/stock.service.ts`
- [x] T013 Generate client migration for stock tables/indexes/FKs via `scripts/migrations/generateMigrations.ts`
- [x] T014 Add e2e test bootstrap utilities for stock fixtures in `test/utils/stock-test.helpers.ts`

**Checkpoint**: Foundation ready — user stories can be implemented and tested independently

---

## Phase 3: User Story 1 - Add Stock to a Warehouse (Priority: P1) 🎯 MVP

**Goal**: Create stock entries with supplier + justification file, supporting multi-product and multi-warehouse line items

**Independent Test**: Submit one stock entry with multiple lines and verify stock items + addition history + supplier/file linkage + capacity warning behavior

### Tests for User Story 1

- [x] T015 [P] [US1] Add e2e test for successful multi-line stock entry creation in `test/stock-us1-create-entry.e2e-spec.ts`
- [x] T016 [P] [US1] Add e2e test for create-entry validation failures (missing supplier/file, quantity <= 0, inactive warehouse) in `test/stock-us1-create-entry-validation.e2e-spec.ts`
- [x] T017 [US1] Add e2e test for capacity warning response on stock entry creation in `test/stock-us1-capacity-warning.e2e-spec.ts`

### Implementation for User Story 1

- [x] T018 [P] [US1] Implement create-stock-entry DTOs in `src/apps/client/features/stock/dto/create-stock-entry.dto.ts`
- [x] T019 [US1] Implement `createStockEntry` transactional flow in `src/apps/client/features/stock/stock.service.ts`
- [x] T020 [US1] Implement `POST /client/stock` endpoint in `src/apps/client/features/stock/stock.controller.ts`
- [x] T021 [US1] Implement `GET /client/stock/entries/:entryId` endpoint wiring in `src/apps/client/features/stock/stock.controller.ts`
- [x] T022 [US1] Add Swagger request/response annotations for stock entry endpoints in `src/apps/client/features/stock/stock.controller.ts`

**Checkpoint**: US1 fully functional and independently testable (MVP)

---

## Phase 4: User Story 2 - View Stock in a Warehouse (Priority: P2)

**Goal**: List stock items per warehouse with pagination and filters

**Independent Test**: Query warehouse stock with pagination and filters and verify only matching active/reserved stock is returned

### Tests for User Story 2

- [x] T023 [P] [US2] Add e2e test for warehouse stock listing pagination in `test/stock-us2-list-pagination.e2e-spec.ts`
- [x] T024 [P] [US2] Add e2e test for warehouse stock filtering/search and empty state in `test/stock-us2-filters-empty.e2e-spec.ts`

### Implementation for User Story 2

- [x] T025 [P] [US2] Implement warehouse stock query DTO in `src/apps/client/features/stock/dto/query-warehouse-stock.dto.ts`
- [x] T026 [US2] Implement `findWarehouseStock` service query (filter + pagination + ordering) in `src/apps/client/features/stock/stock.service.ts`
- [x] T027 [US2] Implement `GET /client/stock/warehouse/:warehouseId` endpoint in `src/apps/client/features/stock/stock.controller.ts`
- [x] T028 [US2] Add Swagger documentation for warehouse stock listing endpoint in `src/apps/client/features/stock/stock.controller.ts`

**Checkpoint**: US2 independently functional and testable

---

## Phase 5: User Story 3 - Move Stock Between Warehouses (Priority: P3)

**Goal**: Transfer one or more active stock items between active warehouses with transfer history recording

**Independent Test**: Move a batch of stock items and verify warehouse reassignment + transfer history; verify validation for inactive destination and same source/destination

### Tests for User Story 3

- [x] T029 [P] [US3] Add e2e test for successful bulk stock transfer in `test/stock-us3-transfer-success.e2e-spec.ts`
- [x] T030 [P] [US3] Add e2e test for transfer conflicts (inactive destination, same warehouse, non-active items) in `test/stock-us3-transfer-conflicts.e2e-spec.ts`

### Implementation for User Story 3

- [x] T031 [P] [US3] Implement move-stock-items DTO in `src/apps/client/features/stock/dto/move-stock-items.dto.ts`
- [x] T032 [US3] Implement `moveStockItems` transactional service flow with conflict checks in `src/apps/client/features/stock/stock.service.ts`
- [x] T033 [US3] Implement `POST /client/stock/move` endpoint in `src/apps/client/features/stock/stock.controller.ts`
- [x] T034 [US3] Add Swagger documentation for stock transfer endpoint in `src/apps/client/features/stock/stock.controller.ts`

**Checkpoint**: US3 independently functional and testable

---

## Phase 6: User Story 4 - Remove / Write-Off Stock (Priority: P4)

**Goal**: Remove active stock items with mandatory reason and immutable removal history

**Independent Test**: Remove single and bulk stock items; verify status becomes removed and repeated removal is rejected

### Tests for User Story 4

- [x] T035 [P] [US4] Add e2e test for successful stock removal/write-off in `test/stock-us4-removal-success.e2e-spec.ts`
- [x] T036 [P] [US4] Add e2e test for removal conflicts (already removed, invalid reason, non-active item) in `test/stock-us4-removal-conflicts.e2e-spec.ts`

### Implementation for User Story 4

- [x] T037 [P] [US4] Implement remove-stock-items DTO in `src/apps/client/features/stock/dto/remove-stock-items.dto.ts`
- [x] T038 [US4] Implement `removeStockItems` transactional service flow in `src/apps/client/features/stock/stock.service.ts`
- [x] T039 [US4] Implement `POST /client/stock/remove` endpoint in `src/apps/client/features/stock/stock.controller.ts`
- [x] T040 [US4] Add Swagger documentation for stock removal endpoint in `src/apps/client/features/stock/stock.controller.ts`

**Checkpoint**: US4 independently functional and testable

---

## Phase 7: User Story 5 - View Stock Movement History (Priority: P5)

**Goal**: Retrieve stock movement history at item, warehouse, and product levels

**Independent Test**: Create-add-move-remove timeline and verify history endpoints return complete ordered events with pagination where required

### Tests for User Story 5

- [x] T041 [P] [US5] Add e2e test for item-level chronological movement history in `test/stock-us5-item-history.e2e-spec.ts`
- [x] T042 [P] [US5] Add e2e test for warehouse-level paginated history in `test/stock-us5-warehouse-history.e2e-spec.ts`
- [x] T043 [P] [US5] Add e2e test for product-level aggregated history in `test/stock-us5-product-history.e2e-spec.ts`

### Implementation for User Story 5

- [x] T044 [P] [US5] Implement history query DTO in `src/apps/client/features/stock/dto/query-stock-history.dto.ts`
- [x] T045 [US5] Implement history service methods (`getItemHistory`, `getWarehouseHistory`, `getProductHistory`) in `src/apps/client/features/stock/stock.service.ts`
- [x] T046 [US5] Implement history endpoints in `src/apps/client/features/stock/stock.controller.ts`
- [x] T047 [US5] Add Swagger documentation for history endpoints in `src/apps/client/features/stock/stock.controller.ts`

**Checkpoint**: US5 independently functional and testable

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Complete cross-story guards, quality, and documentation

- [x] T048 Implement product-deletion guard for active/reserved stock in `src/apps/client/features/products/products.service.ts`
- [x] T049 Implement warehouse-deactivation guard for active/reserved stock in `src/apps/client/features/warehouses/warehouses.service.ts`
- [x] T050 [P] Add regression e2e tests for FR-014 and FR-015 in `test/stock-cross-guards.e2e-spec.ts`
- [x] T051 [P] Ensure stock feature barrel exports are complete in `src/apps/client/features/stock/index.ts`
- [x] T052 [P] Ensure stock DTO barrel exports are complete in `src/apps/client/features/stock/dto/index.ts`
- [x] T053 Validate quickstart command flow and update examples in `specs/001-warehouse-stock-management/quickstart.md`
- [x] T054 Run full validation (`pnpm run build` + targeted e2e specs) and document execution notes in `specs/001-warehouse-stock-management/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: starts immediately
- **Phase 2 (Foundational)**: depends on Phase 1 completion; blocks all user stories
- **Phases 3-7 (User Stories)**: depend on Phase 2; execute in priority order for MVP delivery
- **Phase 8 (Polish)**: depends on all targeted user stories completion

### User Story Dependencies

- **US1 (P1)**: starts after Foundational; no story dependency
- **US2 (P2)**: starts after Foundational; independent of US1 implementation details
- **US3 (P3)**: starts after Foundational; uses stock items produced by fixtures or US1 flow
- **US4 (P4)**: starts after Foundational; uses stock items produced by fixtures or US1 flow
- **US5 (P5)**: starts after Foundational; validated best after US1+US3+US4 events exist

### Within Each User Story

- Write tests first and confirm they fail
- Implement DTOs before service logic
- Implement service logic before controller wiring
- Add Swagger docs after endpoint behavior is stable
- Story is complete only when independent test criteria pass

## Parallel Opportunities

- **Setup**: T002 and T003 can run in parallel after T001
- **Foundational**: T006/T007/T008 can run in parallel after T005
- **US1**: T015 and T016 can run in parallel; T018 can run in parallel with tests
- **US2**: T023 and T024 can run in parallel; T025 can run in parallel with tests
- **US3**: T029 and T030 can run in parallel; T031 can run in parallel with tests
- **US4**: T035 and T036 can run in parallel; T037 can run in parallel with tests
- **US5**: T041/T042/T043 can run in parallel; T044 can run in parallel with tests
- **Polish**: T050 and T051 can run in parallel after T048/T049

## Parallel Example: User Story 1

```bash
# Parallel test creation
T015 [US1] test/stock-us1-create-entry.e2e-spec.ts
T016 [US1] test/stock-us1-create-entry-validation.e2e-spec.ts

# Parallel implementation
T018 [US1] src/apps/client/features/stock/dto/create-stock-entry.dto.ts
T017 [US1] test/stock-us1-capacity-warning.e2e-spec.ts
```

## Parallel Example: User Story 2

```bash
# Parallel tests
T023 [US2] test/stock-us2-list-pagination.e2e-spec.ts
T024 [US2] test/stock-us2-filters-empty.e2e-spec.ts

# Parallel prep work
T025 [US2] src/apps/client/features/stock/dto/query-warehouse-stock.dto.ts
```

## Parallel Example: User Story 3

```bash
# Parallel tests
T029 [US3] test/stock-us3-transfer-success.e2e-spec.ts
T030 [US3] test/stock-us3-transfer-conflicts.e2e-spec.ts

# Parallel DTO
T031 [US3] src/apps/client/features/stock/dto/move-stock-items.dto.ts
```

## Parallel Example: User Story 4

```bash
# Parallel tests
T035 [US4] test/stock-us4-removal-success.e2e-spec.ts
T036 [US4] test/stock-us4-removal-conflicts.e2e-spec.ts

# Parallel DTO
T037 [US4] src/apps/client/features/stock/dto/remove-stock-items.dto.ts
```

## Parallel Example: User Story 5

```bash
# Parallel tests
T041 [US5] test/stock-us5-item-history.e2e-spec.ts
T042 [US5] test/stock-us5-warehouse-history.e2e-spec.ts
T043 [US5] test/stock-us5-product-history.e2e-spec.ts

# Parallel DTO
T044 [US5] src/apps/client/features/stock/dto/query-stock-history.dto.ts
```

## Implementation Strategy

### MVP First (US1 only)

1. Complete Phase 1 + Phase 2
2. Complete US1 (Phase 3)
3. Validate independent US1 test criteria
4. Demo/deploy MVP

### Incremental Delivery

1. Deliver US1 (stock entry creation)
2. Deliver US2 (warehouse stock visibility)
3. Deliver US3 (stock transfer)
4. Deliver US4 (write-off removal)
5. Deliver US5 (movement history)
6. Complete polish and cross-cutting guards

### Parallel Team Strategy

1. Team aligns on Phase 1 + 2 together
2. After Foundation:
   - Engineer A: US1/US2
   - Engineer B: US3/US4
   - Engineer C: US5 + cross-cutting tests
3. Merge by story checkpoints to preserve independent testability

## Notes

- [P] tasks are file-isolated and dependency-safe for parallel execution
- [USx] labels provide direct traceability to user stories
- Keep each story independently releasable and testable
- Prefer small PRs per story checkpoint to reduce merge conflicts
