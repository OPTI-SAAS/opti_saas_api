# Tasks: Client Management

**Input**: Design documents from `/specs/003-client-management/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: No explicit TDD/test-first requirement was requested in the feature spec, so test tasks are omitted from this list.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently. User stories 1–3 (register three client types) are combined into a single foundational phase since they share the same entity, service, and controller — implementing them separately would create artificial splits.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create feature module scaffold, enum definitions, and entity files.

- [x] T001 Create client type enum constants in libs/shared/src/enums/client/client.client.enum.ts
- [x] T002 [P] Export client enums from libs/shared/src/enums/client/index.ts
- [x] T003 [P] Export client enums from libs/shared/src/enums/index.ts
- [x] T004 Create feature module scaffold with empty controller, service, and module in src/apps/client/features/clients/clients.module.ts
- [x] T005 [P] Create barrel export in src/apps/client/features/clients/index.ts
- [x] T006 Register ClientsModule in src/apps/client/client.module.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create all three entities, migration, DTOs, and base service/controller plumbing that ALL user stories depend on.

**⚠️ CRITICAL**: No user story implementation should start until this phase is complete.

- [x] T007 Create ClClient entity with all shared, particulier, passage, and professionnel columns, CHECK constraint, indexes, and self-referential sponsor relation in libs/shared/src/entities/client/clients.client.entity.ts
- [x] T008 [P] Create ClConvention entity with one-to-one relation to ClClient, CHECK on dates, unique on client_id in libs/shared/src/entities/client/conventions.client.entity.ts
- [x] T009 [P] Create ClContactInterne entity with many-to-one relation to ClClient, index on client_id in libs/shared/src/entities/client/contacts-internes.client.entity.ts
- [x] T010 Export new entities from libs/shared/src/entities/client/index.ts and libs/shared/src/entities/index.ts
- [x] T011 Create migration with clients, conventions, and contacts_internes tables, all constraints and indexes in libs/shared/src/migrations/client/TIMESTAMP-create-clients-conventions-contacts-internes.ts
- [x] T012 Create type guard functions (isClientParticulier, isClientPassage, isClientProfessionnel) in libs/shared/src/enums/client/client.client.enum.ts
- [x] T013 Create CreateClientDto with discriminator-based conditional validation (type-specific required fields) in src/apps/client/features/clients/dto/create-client.dto.ts
- [x] T014 [P] Create UpdateClientDto using PartialType with type field excluded (immutable) in src/apps/client/features/clients/dto/update-client.dto.ts
- [x] T015 [P] Create QueryClientsDto extending PaginationQueryDto with type, active, search, and familyGroupId filters in src/apps/client/features/clients/dto/query-clients.dto.ts
- [x] T016 [P] Create ConventionDto with all convention fields and date validation (dateFin > dateDebut) in src/apps/client/features/clients/dto/convention.dto.ts
- [x] T017 [P] Create CreateContactInterneDto and UpdateContactInterneDto in src/apps/client/features/clients/dto/contact-interne.dto.ts
- [x] T018 Export all DTOs from src/apps/client/features/clients/dto/index.ts

**Checkpoint**: Foundation ready — all entities, migration, and DTOs are in place. User story implementation can begin.

---

## Phase 3: User Story 1 - Register an Individual Client (Priority: P1) 🎯 MVP

**Goal**: Staff can register a particulier client with personal details, identity document, social coverage, sponsorship, and open-schema medical record.

**Independent Test**: POST `/api/client/clients` with type `particulier`, required fields (title, lastName, firstName, birthDate), and a medical record JSON object. Verify created client is retrievable by ID.

### Implementation for User Story 1

- [x] T019 [US1] Implement createClient method in service with type-specific validation, sponsor existence check, and medical record defaulting in src/apps/client/features/clients/clients.service.ts
- [x] T020 [US1] Implement POST /client/clients endpoint in controller with Swagger decorators, DTO validation pipe, and response mapping in src/apps/client/features/clients/clients.controller.ts
- [x] T021 [US1] Implement getClientById method in service with eager loading of convention and contacts for detail view in src/apps/client/features/clients/clients.service.ts
- [x] T022 [US1] Implement GET /client/clients/:id endpoint in controller with Swagger decorators in src/apps/client/features/clients/clients.controller.ts

**Checkpoint**: User Story 1 is independently functional — can create and retrieve a particulier client.

---

## Phase 4: User Story 2 - Register a Walk-in Client (Priority: P1)

**Goal**: Staff can quickly register a passage client with minimal information (no required type-specific fields).

**Independent Test**: POST `/api/client/clients` with type `passage` and no additional fields. Verify client is created with `active = true`.

### Implementation for User Story 2

- [x] T023 [US2] Add passage-specific validation branch (no required type-specific fields) to createClient in src/apps/client/features/clients/clients.service.ts
- [x] T024 [US2] Verify passage clients can be created and retrieved via existing endpoints in src/apps/client/features/clients/clients.controller.ts

**Checkpoint**: User Story 2 is independently functional — walks in can be registered instantly.

---

## Phase 5: User Story 3 - Register a Business Client (Priority: P1)

**Goal**: Staff can register a professionnel client with company details, tax information, ICE uniqueness enforcement, and VAT status.

**Independent Test**: POST `/api/client/clients` with type `professionnel`, required fields (companyName, taxId, ice, vatExempt). Verify ICE uniqueness is enforced (409 on duplicate).

### Implementation for User Story 3

- [x] T025 [US3] Add professionnel-specific validation branch and ICE uniqueness check (catch unique constraint violation → 409) to createClient in src/apps/client/features/clients/clients.service.ts
- [x] T026 [US3] Verify professionnel clients can be created with ICE conflict handling via existing endpoints in src/apps/client/features/clients/clients.controller.ts

**Checkpoint**: User Story 3 is independently functional — business clients can be registered with ICE uniqueness enforced.

---

## Phase 6: User Story 4 - Manage Convention for Business Client (Priority: P2)

**Goal**: Attach, update, or remove a convention (trade agreement) on a professional client.

**Independent Test**: Create a professionnel client, PUT a convention, verify it's returned in the client detail. Update it, verify changes. DELETE it, verify removal. Attempt on non-professionnel → 400.

### Implementation for User Story 4

- [x] T027 [US4] Implement upsertConvention method in service (create or update, reject non-professionnel) in src/apps/client/features/clients/clients.service.ts
- [x] T028 [US4] Implement deleteConvention method in service (remove convention, 404 if none) in src/apps/client/features/clients/clients.service.ts
- [x] T029 [US4] Implement PUT /client/clients/:clientId/convention endpoint with Swagger decorators in src/apps/client/features/clients/clients.controller.ts
- [x] T030 [US4] Implement DELETE /client/clients/:clientId/convention endpoint with Swagger decorators in src/apps/client/features/clients/clients.controller.ts

**Checkpoint**: User Story 4 is independently functional — conventions can be managed on professional clients.

---

## Phase 7: User Story 5 - Manage Internal Contacts for Business Client (Priority: P2)

**Goal**: Add, update, list, and delete internal contacts for a professional client, with automatic principal contact swap.

**Independent Test**: Create a professionnel client, add two contacts (second as principal → first auto-unmarked). Update a contact. Delete a contact. Attempt on non-professionnel → 400.

### Implementation for User Story 5

- [x] T031 [US5] Implement addContact method in service (create contact, auto-unmark existing principal in transaction, reject non-professionnel) in src/apps/client/features/clients/clients.service.ts
- [x] T032 [US5] Implement updateContact method in service (update fields, handle principal swap, verify contact belongs to client) in src/apps/client/features/clients/clients.service.ts
- [x] T033 [US5] Implement deleteContact method in service (remove contact, verify ownership) in src/apps/client/features/clients/clients.service.ts
- [x] T034 [US5] Implement listContacts method in service (return all contacts for a client) in src/apps/client/features/clients/clients.service.ts
- [x] T035 [US5] Implement POST /client/clients/:clientId/contacts endpoint in src/apps/client/features/clients/clients.controller.ts
- [x] T036 [P] [US5] Implement PATCH /client/clients/:clientId/contacts/:contactId endpoint in src/apps/client/features/clients/clients.controller.ts
- [x] T037 [P] [US5] Implement DELETE /client/clients/:clientId/contacts/:contactId endpoint in src/apps/client/features/clients/clients.controller.ts
- [x] T038 [US5] Implement GET /client/clients/:clientId/contacts endpoint in src/apps/client/features/clients/clients.controller.ts

**Checkpoint**: User Story 5 is independently functional — internal contacts can be managed with principal auto-swap.

---

## Phase 8: User Story 6 - List, Search, and Filter Clients (Priority: P2)

**Goal**: Paginated client list with filters by type, active status, and ILIKE search on lastName/companyName.

**Independent Test**: Create several clients of different types, query with filters (type, active, search, combinaisons), verify pagination metadata and correct result sets.

### Implementation for User Story 6

- [x] T039 [US6] Implement listClients method in service with QueryBuilder: type filter, active filter (default true), ILIKE search on last_name/first_name/company_name, pagination in src/apps/client/features/clients/clients.service.ts
- [x] T040 [US6] Implement GET /client/clients endpoint with query params, Swagger decorators, and pagination response in src/apps/client/features/clients/clients.controller.ts

**Checkpoint**: User Story 6 is independently functional — clients can be searched, filtered, and paginated.

---

## Phase 9: User Story 7 - View and Update Client Details (Priority: P2)

**Goal**: View full client profile (with convention and contacts if professionnel) and update mutable fields. Reject type changes.

**Independent Test**: Fetch client by ID → full profile. PATCH to update phone/address → verify changes. PATCH to change type → 400. PATCH medical record → verify replacement.

### Implementation for User Story 7

- [x] T041 [US7] Implement updateClient method in service (reject type change, validate sponsor if changed, replace medical record entirely) in src/apps/client/features/clients/clients.service.ts
- [x] T042 [US7] Implement PATCH /client/clients/:id endpoint with Swagger decorators and UpdateClientDto in src/apps/client/features/clients/clients.controller.ts

**Checkpoint**: User Story 7 is independently functional — client details can be viewed and updated.

---

## Phase 10: User Story 8 - Deactivate and Reactivate a Client (Priority: P3)

**Goal**: Set `active = false` to deactivate and `active = true` to reactivate. Deactivated clients are excluded from default list queries.

**Independent Test**: Create client, deactivate → verify excluded from default list. Reactivate → verify reappears.

### Implementation for User Story 8

- [x] T043 [US8] Implement deactivateClient and reactivateClient methods in service in src/apps/client/features/clients/clients.service.ts
- [x] T044 [US8] Implement PATCH /client/clients/:id/deactivate endpoint with Swagger decorators in src/apps/client/features/clients/clients.controller.ts
- [x] T045 [P] [US8] Implement PATCH /client/clients/:id/reactivate endpoint with Swagger decorators in src/apps/client/features/clients/clients.controller.ts

**Checkpoint**: User Story 8 is independently functional — clients can be deactivated and reactivated.

---

## Phase 11: User Story 9 - Manage Family Groups (Priority: P3)

**Goal**: Assign particulier clients to a family group via familyGroupId integer label and query group members.

**Independent Test**: Create two particulier clients with same familyGroupId, query by familyGroupId filter → both returned.

### Implementation for User Story 9

- [x] T046 [US9] Verify familyGroupId filter works in listClients QueryBuilder (already wired in T039) in src/apps/client/features/clients/clients.service.ts
- [x] T047 [US9] Verify family group assignment and removal via PATCH endpoint (already wired in T042) in src/apps/client/features/clients/clients.controller.ts

**Checkpoint**: User Story 9 is independently functional — family group members can be queried.

---

## Phase 12: Polish & Cross-Cutting Concerns

**Purpose**: Documentation sync, cleanup, and validation across all user stories.

- [x] T048 [P] Sync OpenAPI contract with final implemented request/response shapes in specs/003-client-management/contracts/client-management.openapi.yaml
- [x] T049 [P] Sync quickstart examples with final endpoint behavior in specs/003-client-management/quickstart.md
- [x] T050 Verify all Swagger decorators are complete and consistent across all endpoints in src/apps/client/features/clients/clients.controller.ts
- [ ] T051 Run quickstart.md validation against running API

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Starts immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories.
- **Phase 3 (US1)**: Depends on Phase 2. Creates core create/get service and controller methods.
- **Phase 4 (US2)**: Depends on Phase 3 (reuses createClient method with passage branch).
- **Phase 5 (US3)**: Depends on Phase 3 (reuses createClient method with professionnel branch).
- **Phase 6 (US4)**: Depends on Phase 5 (needs professionnel client to exist).
- **Phase 7 (US5)**: Depends on Phase 5 (needs professionnel client to exist). Can run in parallel with Phase 6.
- **Phase 8 (US6)**: Depends on Phase 3 (needs clients to exist for listing).
- **Phase 9 (US7)**: Depends on Phase 3 (needs existing clients).
- **Phase 10 (US8)**: Depends on Phase 8 (deactivation integrates with list filter).
- **Phase 11 (US9)**: Depends on Phase 8 (family group uses listClients filter).
- **Phase 12 (Polish)**: Depends on all user stories being complete.

### User Story Dependencies

- **US1 (P1)**: Independent after foundational — creates core service/controller methods used by all.
- **US2 (P1)**: Depends on US1 (reuses createClient method).
- **US3 (P1)**: Depends on US1 (reuses createClient method).
- **US4 (P2)**: Depends on US3 (conventions only for professionnel).
- **US5 (P2)**: Depends on US3 (contacts only for professionnel). Parallelizable with US4.
- **US6 (P2)**: Independent after US1. Parallelizable with US4/US5.
- **US7 (P2)**: Independent after US1. Parallelizable with US4/US5/US6.
- **US8 (P3)**: Independent after US6 (integration with list filter).
- **US9 (P3)**: Independent after US6 (family group query via list filter).

### Parallel Opportunities

- **Foundational**: T008 and T009 (convention and contact entities) in parallel. T013–T017 (all DTOs) in parallel.
- **After US3**: US4 and US5 can run in parallel (convention vs contacts, different service methods).
- **After US1**: US6 and US7 can run in parallel with US4/US5 (different service methods).
- **After US6**: US8 and US9 can run in parallel.
- **Polish**: T048 and T049 can run in parallel.

---

## Parallel Example: User Story 4 + 5

```bash
# After Phase 5 (US3) is complete, convention and contacts can be implemented concurrently:
Task T027-T030  # Developer A: Convention management
Task T031-T038  # Developer B: Internal contacts management
```

## Parallel Example: User Story 6 + 7

```bash
# After Phase 3 (US1) is complete, list/search and update can be implemented concurrently:
Task T039-T040  # Developer A: List, search, filter
Task T041-T042  # Developer B: Update client details
```

---

## Implementation Strategy

### MVP First (User Stories 1–3)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (entities, migration, DTOs)
3. Complete Phase 3: US1 — register particulier client
4. Complete Phase 4: US2 — register passage client
5. Complete Phase 5: US3 — register professionnel client
6. **STOP and VALIDATE**: All three client types can be created and retrieved
7. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 + US2 + US3 → All client types registered → Deploy/Demo (MVP!)
3. US4 + US5 → Convention and contacts for business clients → Deploy/Demo
4. US6 + US7 → Search/filter and update → Deploy/Demo
5. US8 + US9 → Deactivation and family groups → Deploy/Demo
6. Polish → Final docs synchronization

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. One developer completes US1 → US2 → US3 (sequential, same service file)
3. Once US3 is done:
   - Developer A: US4 (convention) + US5 (contacts)
   - Developer B: US6 (list/search) + US7 (update)
4. Once US6 is done:
   - US8 (deactivate) and US9 (family groups) can proceed
5. Polish tasks split across team

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- US1–US3 share the same entity/controller/service — implement sequentially for safety
- US4 and US5 target different service methods and can be parallelized
- All DTOs (T013–T017) can be created in parallel during foundational phase
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently

---

## Evolution: Business Rules N1–N4 (Post-Initial Implementation)

All 50 original tasks above are completed (✅). The following business rules were identified during code review and document refinements that evolved the original design:

### N1 — Family Group Links

Clients connect to a family group via `familyGroupId` (UUID FK to `family_groups` table) and a `familyLink` role: `principal`, `conjoint`, `tutor`, `parent`, `children`. Family groups are a full entity (`ClFamilyGroup`) with name, shared address (JSONB), and notes — no longer a simple integer label.

### N2 — Family Search

Users need to search family groups by: family address, participant phone number, participant first/last name. Returns a list of family groups with each family's participants.

### N3 — Family Assignment on Client Creation

1. If `familyId` is sent → assign client to that family group
2. If `familyId` is empty AND `tutorId` is sent with tutor having `tutorFamily=true` → use the tutor's family group
3. If `tutorPayload` is sent → create a new family group
4. If client `isMinor` → create a new family group with the minor as `principal`

### N4 — User Types (2-Type Model)

- **Particulier**: `type='particulier'`, `passager=false`
- **Passage**: `type='particulier'`, `passager=true`
- **Professionnel**: `type='professionnel'`

The DB CHECK constraint is `type IN ('particulier', 'professionnel')`. Passage is a serialization group, not a database type.

### Code Review Fixes Applied

- Entity and DTO field types aligned with `@optisaas/opti-saas-lib` types (`ClientType`, `Civilities`, `FamilyLink`)
- Email fields validated with `@IsEmail()` (not just `@IsString()`)
- Convention `tauxRemise` capped at `@Max(100)`
- Sponsor validation checks `active: true` status
- `deleteFamilyGroup` uses QueryBuilder to SET NULL (not `undefined`)
- Added `isClientPassage` type guard (`type='particulier' && passager=true`)
- Title values updated: `mrs`, `Mr`, `Autre` (from lib `Civilities` type)
