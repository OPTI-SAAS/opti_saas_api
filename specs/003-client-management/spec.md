# Feature Specification: Client Management

**Feature Branch**: `003-client-management`  
**Created**: 2026-03-04  
**Status**: Draft  
**Input**: User description: "Client management feature with three client types (particulier, passage, professionnel), conventions, internal contacts, and open medical records"

## Assumptions

- This feature introduces a new "Clients" module in the client-facing application. It is a standalone bounded context with no dependencies on existing features (stock, products, suppliers).
- The system supports two mutually exclusive client types distinguished by a `type` discriminator: **particulier** (individual) and **professionnel** (business). A client record belongs to exactly one type and the type cannot be changed after creation.
- **Particulier** clients have the richest data profile: personal identity, family group links, social coverage details, sponsorship, and a medical record.
- **Passage** (walk-in) clients are modeled as `type='particulier'` with `passager=true`. They are lightweight records — only last name and first name are optionally captured alongside shared base fields. The `passager` flag is immutable after creation.
- **Professionnel** clients represent companies, carrying business identification fields (tax ID, ICE, commercial register), a VAT exemption flag, an optional convention (trade agreement), and zero or more internal contacts.
- Medical records are stored as open-schema JSON. The system validates that the value is a valid JSON object but does **not** enforce a rigid set of fields. The consuming UI is responsible for field interpretation. This allows the medical form to evolve without back-end migrations.
- Conventions and internal contacts for professional clients are separate entities with their own identity and lifecycle — they are **not** embedded as JSON inside the client record.
- A convention belongs to exactly one professional client (one-to-one). Internal contacts belong to exactly one professional client (one-to-many).
- The `sponsorId` on a particulier client is a self-referential link to another client. The sponsor must exist **and be active** at the time of assignment.
- The `tutorId` on a particulier client is a self-referential link to another client acting as legal guardian for a minor. When `isMinor=true`, a tutor relationship is required.
- Family groups are a separate entity (`family_groups` table) with their own CRUD lifecycle. A family group has a name (`nom`), an optional shared address (JSONB), and optional notes. Particulier clients link to a family group via `familyGroupId` (UUID FK) and declare their role via `familyLink` (principal, conjoint, tutor, parent, children). Family group management (create, list, get by ID, update, delete) is in scope.
- `active` defaults to `true` on creation. Deleting a client soft-deactivates it (`active = false`) rather than physically removing the row.
- Pagination is mandatory for all list endpoints. Filtering by type, name/company, phone, email, and active status is in scope.
- All endpoints require authentication and tenant scoping per the existing project patterns.
- Title values for particulier clients are constrained to a known set: `mrs`, `Mr`, `Autre` (sourced from `Civilities` type in `@optisaas/opti-saas-lib`).
- ID document types are constrained to a known set: CIN, Passport, Carte de séjour. Additional types may be added later.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Register an Individual Client (Priority: P1)

As an optician staff member, I want to register a new individual client (particulier) with their personal details, identity document, social coverage, and medical record, so that the client profile is ready before starting any optical service.

**Why this priority**: Individual clients are the most common client type in an optical store. Their registration unlocks all downstream workflows (prescriptions, orders, invoicing). Without this, the system cannot serve its primary users.

**Independent Test**: Can be fully tested by sending a create request with type `particulier`, required personal fields (title, lastName, firstName, birthDate), optional identity/coverage/family fields, and a medical record JSON object. Verify the client is persisted, retrievable by ID, and appears in the client list filtered by type `particulier`.

**Acceptance Scenarios**:

1. **Given** no client exists with the provided details, **When** the user submits a creation request with type `particulier`, title `Mr`, lastName `Benali`, firstName `Youssef`, birthDate `1990-05-15`, and a medical record `{"currentlyWearing": "glasses", "hasDryness": true}`, **Then** the client is created with `active = true`, assigned an auto-generated ID, and the response contains all submitted fields including the medical record as-is.
2. **Given** the user provides a `sponsorId` that references an existing active client, **When** the creation request is submitted, **Then** the client is created with the sponsor link saved.
3. **Given** the user provides a `sponsorId` that references a non-existent or inactive client, **When** the creation request is submitted, **Then** the request is rejected with a validation error identifying the invalid sponsor.
4. **Given** required fields (title, lastName, firstName, birthDate) are missing, **When** the creation request is submitted, **Then** the request is rejected with validation errors listing each missing field.
5. **Given** the medical record field contains a non-object value (e.g., a string or number), **When** the creation request is submitted, **Then** the request is rejected with a validation error stating the medical record must be a JSON object.
6. **Given** the medical record field is omitted or sent as an empty object `{}`, **When** the creation request is submitted, **Then** the client is created successfully with the medical record stored as `{}`.

---

### User Story 2 - Register a Walk-in Client (Priority: P1)

As an optician staff member, I want to quickly register a walk-in client (passage) with minimal information, so that I can proceed with a one-time service without requiring full client registration.

**Why this priority**: Walk-in registrations must be fast and frictionless. This is equally critical to P1 because many optical stores serve walk-in customers daily and the workflow must be instant.

**Independent Test**: Can be fully tested by sending a create request with type `particulier` and `passager=true`, optionally with lastName/firstName. Verify the client is persisted with minimal data and appears in the client list when filtered for passage clients.

**Acceptance Scenarios**:

1. **Given** the user submits a creation request with type `particulier` and `passager=true`, **When** the request is processed, **Then** the client is created with `active = true`, `passager = true`, no name fields required, and an auto-generated ID.
2. **Given** the user provides optional lastName and firstName, **When** the creation request is submitted, **Then** the client is created with those name fields saved.
3. **Given** the user provides base fields (phone, email, city, address), **When** the creation request is submitted, **Then** all provided base fields are persisted.

---

### User Story 3 - Register a Business Client (Priority: P1)

As an optician staff member, I want to register a business client (professionnel) with company details, tax information, and VAT status, so that the store can manage B2B relationships and issue proper invoices.

**Why this priority**: Business clients require distinct data (tax ID, ICE, company name) and unlock B2B workflows (conventions, bulk orders). This is critical for stores that serve companies, insurance firms, and mutual organizations.

**Independent Test**: Can be fully tested by sending a create request with type `professionnel`, required business fields (companyName, taxId, ice, vatExempt), and verifying the client is persisted and retrievable.

**Acceptance Scenarios**:

1. **Given** no business client exists with the provided tax ID, **When** the user submits a creation request with type `professionnel`, companyName `OptikVision SARL`, taxId `12345678`, ice `001234567000012`, vatExempt `false`, **Then** the client is created with all business fields saved and `active = true`.
2. **Given** required business fields (companyName, taxId, ice) are missing, **When** the creation request is submitted, **Then** the request is rejected with validation errors listing each missing field.
3. **Given** a business client already exists with the same `ice`, **When** a new creation request is submitted with that same ICE, **Then** the request is rejected with an error indicating the ICE must be unique.

---

### User Story 4 - Manage Convention for Business Client (Priority: P2)

As an optician manager, I want to attach a convention (trade agreement) to a business client with discount rates, credit limits, and payment terms, so that the agreed commercial conditions are formally recorded and available for invoicing.

**Why this priority**: Conventions define the commercial relationship with a business client. While not required for initial registration, they are needed before any B2B transaction can be properly invoiced.

**Independent Test**: Can be fully tested by creating a professional client, then attaching a convention with all fields (numero, dates, taux_remise, plafond_credit, delai_paiement, notes). Verify the convention is persisted and returned when fetching the client.

**Acceptance Scenarios**:

1. **Given** an existing professional client with no convention, **When** the user creates a convention with numero `CONV-2026-001`, date_debut `2026-01-01`, date_fin `2026-12-31`, taux_remise `10`, plafond_credit `50000`, delai_paiement `30`, **Then** the convention is attached to the client and returned in subsequent client reads.
2. **Given** an existing professional client already has a convention, **When** the user updates the convention fields, **Then** the existing convention is updated (not duplicated).
3. **Given** the user attempts to attach a convention to a non-professional client, **When** the request is submitted, **Then** it is rejected with an error indicating conventions are only available for professional clients.
4. **Given** an existing convention, **When** the user removes it (sets to null), **Then** the convention record is deleted and the client no longer has a convention.

---

### User Story 5 - Manage Internal Contacts for Business Client (Priority: P2)

As an optician manager, I want to add, update, and remove internal contacts for a business client, so that I know who to reach at the company and who the primary point of contact is.

**Why this priority**: Internal contacts are essential for day-to-day communication with business clients but can be added after initial registration.

**Independent Test**: Can be fully tested by creating a professional client, adding two contacts (one marked as principal), then updating and deleting contacts. Verify list, add, update, and delete operations work correctly.

**Acceptance Scenarios**:

1. **Given** an existing professional client, **When** the user adds an internal contact with nom `Alami`, prenom `Sara`, fonction `Responsable RH`, telephone `0612345678`, email `s.alami@company.ma`, principal `true`, **Then** the contact is created and linked to the client.
2. **Given** the client already has a principal contact, **When** the user adds another contact marked as principal, **Then** the previous principal contact is automatically unmarked, and the new contact becomes the sole principal.
3. **Given** an existing contact, **When** the user updates the contact's function and phone, **Then** the changes are persisted.
4. **Given** an existing contact, **When** the user deletes it, **Then** the contact is removed from the client's contact list.
5. **Given** the user attempts to add a contact to a non-professional client, **When** the request is submitted, **Then** it is rejected.

---

### User Story 6 - List, Search, and Filter Clients (Priority: P2)

As an optician staff member, I want to search and filter the client list by type, name, phone, email, or active status, so that I can quickly find the client I need.

**Why this priority**: Without search and filtering, the client list becomes unusable as the number of clients grows. This is essential for daily operations but depends on clients existing first.

**Independent Test**: Can be fully tested by creating several clients of different types, then querying the list endpoint with various filter combinations and verifying correct results and pagination.

**Acceptance Scenarios**:

1. **Given** 50 clients exist (mix of types), **When** the user requests the client list without filters, **Then** a paginated list is returned with default page size, total count, and page metadata.
2. **Given** clients exist, **When** the user filters by type `particulier`, **Then** only individual clients are returned.
3. **Given** clients exist, **When** the user searches by name `Benali`, **Then** clients whose lastName or companyName contains `Benali` are returned (case-insensitive partial match).
4. **Given** clients exist, **When** the user filters by active `false`, **Then** only deactivated clients are returned.
5. **Given** clients exist, **When** the user combines filters (type `professionnel` + search `optik`), **Then** only professional clients matching the search are returned.

---

### User Story 7 - View and Update Client Details (Priority: P2)

As an optician staff member, I want to view the full details of a client and update their information, so that client records stay accurate over time.

**Why this priority**: Updates are a natural follow-up to registration. Clients change addresses, phone numbers, coverage details, and medical records.

**Independent Test**: Can be fully tested by creating a client, fetching its full details by ID, then updating specific fields and verifying the changes are persisted.

**Acceptance Scenarios**:

1. **Given** an existing particulier client, **When** the user fetches the client by ID, **Then** the full profile is returned including personal details, coverage, family group info, and medical record.
2. **Given** an existing client, **When** the user updates the phone and address, **Then** the changes are saved and the `updated_at` timestamp is refreshed.
3. **Given** an existing particulier client, **When** the user updates the medical record with new JSON content, **Then** the medical record is replaced entirely with the new JSON object.
4. **Given** a non-existent client ID, **When** the user requests details, **Then** a 404 error is returned.
5. **Given** an existing client, **When** the user changes the type field, **Then** the request is rejected — type is immutable after creation.

---

### User Story 8 - Deactivate and Reactivate a Client (Priority: P3)

As an optician manager, I want to deactivate a client who is no longer active and reactivate them if they return, so that inactive clients are excluded from default searches without losing their data.

**Why this priority**: Soft delete is important for data retention and audit, but is a lower-frequency operation.

**Independent Test**: Can be fully tested by creating a client, deactivating it, verifying it no longer appears in default (active-only) lists, then reactivating it.

**Acceptance Scenarios**:

1. **Given** an active client, **When** the user deactivates the client, **Then** the `active` field is set to false and the client no longer appears in default list queries.
2. **Given** an inactive client, **When** the user reactivates the client, **Then** the `active` field is set to true and the client reappears in default list queries.
3. **Given** a professional client with a convention and contacts, **When** the client is deactivated, **Then** the convention and contacts remain in the database but the client is excluded from active searches.

---

### User Story 9 - Manage Family Groups (Priority: P3)

As an optician staff member, I want to group individual clients into family groups so that I can view all family members together and share relevant information (mutual, address).

**Why this priority**: Family groups add convenience but are not required for core client registration workflows.

**Independent Test**: Can be fully tested by creating multiple particulier clients, assigning them to the same family group, and querying members of that group.

**Acceptance Scenarios**:

1. **Given** a family group exists, **When** the user assigns two individual clients to that family group with appropriate family links (e.g., `principal`, `conjoint`), **Then** both clients belong to the same group and a query for the group returns both members.
2. **Given** a client in a family group, **When** the user removes them from the group (sets familyGroupId to null), **Then** the client is no longer part of any family group.
3. **Given** a family group exists, **When** one member has `hasSharedAddress = true`, **Then** the system indicates this member shares the address with the family group.
4. **Given** a family group is deleted, **When** the deletion is processed, **Then** all member clients have their `familyGroupId` and `familyLink` set to NULL.

---

### Edge Cases

- What happens when a client is created with an email that already exists for another client of the same type? → The system allows duplicate emails; email is not a unique constraint (multiple family members may share an email).
- What happens when a professional client's ICE is duplicated? → The system rejects it; ICE must be unique per tenant.
- What happens when a convention's `date_fin` is before `date_debut`? → The system rejects it with a validation error.
- What happens when the medical record JSON exceeds a reasonable size? → The system enforces a maximum payload size (standard request-size limits apply).
- What happens when a client is deactivated while referenced as a sponsor? → The sponsor link remains but future lookups flag the sponsor as inactive.
- What happens when all internal contacts are deleted from a professional client? → The client can exist without contacts; this is valid.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST support creating clients of two types: `particulier` and `professionnel`. The type is set at creation and is immutable. Passage clients are modeled as `type='particulier'` with `passager=true`.
- **FR-002**: System MUST validate required fields per client type — title, lastName, firstName, birthDate for particulier; companyName, taxId, ice, vatExempt for professionnel; no required type-specific fields for passage.
- **FR-003**: System MUST store the medical record for particulier clients as an open-schema JSON object. The system validates the value is a valid JSON object but does not enforce specific fields within it.
- **FR-004**: System MUST enforce ICE uniqueness per tenant for professional clients.
- **FR-005**: System MUST support conventions (trade agreements) for professional clients only, with fields: numero, date_debut, date_fin, taux_remise, plafond_credit, delai_paiement, notes. A professional client can have at most one convention.
- **FR-006**: System MUST support internal contacts for professional clients only. Each contact has: nom, prenom, fonction, telephone, email, principal. Exactly one contact may be marked as principal at any time; setting a new principal automatically unmarks the previous one.
- **FR-007**: System MUST support listing clients with pagination, filtering by type, active status, and searching by name (lastName or companyName) with case-insensitive partial matching.
- **FR-008**: System MUST support updating all mutable client fields. The `type` field is immutable and must be rejected on update.
- **FR-009**: System MUST support soft-delete (deactivate) and reactivate operations. Default list queries return only active clients unless the `active` filter is explicitly set.
- **FR-010**: System MUST validate that `sponsorId`, when provided, references an existing active client within the same tenant.
- **FR-011**: System MUST support family group assignment for particulier clients, including querying all members of a given family group.
- **FR-012**: System MUST constrain title to allowed values: `mrs`, `Mr`, `Autre` (from `Civilities` type).
- **FR-018**: System MUST validate email fields with proper email format validation (not just string validation).
- **FR-019**: System MUST constrain `taux_remise` (discount rate) to a maximum of 100.
- **FR-020**: System MUST constrain `familyLink` to allowed values: `principal`, `conjoint`, `tutor`, `parent`, `children` (from `FamilyLink` type).
- **FR-013**: System MUST constrain idDocumentType to allowed values: CIN, Passport, Carte de séjour.
- **FR-014**: System MUST enforce that convention date_fin is after date_debut when both are provided.
- **FR-015**: System MUST default `active` to `true` on client creation.
- **FR-016**: System MUST default medical record to `{}` when not provided for particulier clients.
- **FR-017**: System MUST update the `updated_at` timestamp on every modification.

### Key Entities

- **Client**: The core entity representing any person or organization doing business with the optical store. Distinguished by a `type` discriminator (`particulier`, `passage`, `professionnel`). Holds shared base fields (phone, email, city, address, active) and type-specific fields. Belongs to exactly one tenant.
- **Convention**: A trade agreement attached to a professional client (one-to-one). Contains commercial terms: agreement number, validity dates, discount rate, credit ceiling, payment delay, and notes.
- **Internal Contact (ContactInterne)**: A person within a business client's organization (one-to-many from Client). Contains name, role, phone, email, and a principal flag.
- **Family Group**: A separate entity (`family_groups` table) grouping individual (particulier) clients who are related. Has a name, optional shared address (JSONB), and notes. Members link via `familyGroupId` (UUID FK) and declare their `familyLink` role (principal, conjoint, tutor, parent, children) and sharing preferences (mutual, address).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Staff can register a new individual client with full details (including medical record) in under 2 minutes.
- **SC-002**: Staff can register a walk-in client in under 15 seconds.
- **SC-003**: Staff can register a business client with company details and a convention in under 3 minutes.
- **SC-004**: The client list returns filtered, paginated results to the user in under 1 second for up to 10,000 clients per tenant.
- **SC-005**: 95% of client searches by name or phone return the expected result on the first query.
- **SC-006**: Staff can update any client's medical record without requiring a system update or migration — the JSON field accepts any valid JSON object structure.
- **SC-007**: Deactivated clients do not appear in default search results, ensuring a clean active client list.
- **SC-008**: Business clients can have their convention and internal contacts managed independently without affecting the base client record.
