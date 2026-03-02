# API Requirements Checklist: Bulk Stock Receipt

**Purpose**: Validate API requirement quality for the bulk stock receipt specification before implementation.
**Created**: 2026-03-01
**Feature**: [spec.md](../spec.md)

## Requirement Completeness

- [ ] CHK001 Are request field requirements fully specified for top-level payload fields (`supplierId`, `fileId`, `newProducts`, `existingProducts`), including required/optional status? [Completeness, Spec §FR-001, Spec §FR-002, Spec §FR-003, Spec §FR-004]
- [ ] CHK002 Are per-item API requirements complete for both arrays, including `warehouseId`, `quantity`, and per-unit `purchasePrice`? [Completeness, Spec §FR-003, Spec §FR-004]
- [ ] CHK003 Are all required validation outcomes documented for missing/invalid references (`supplierId`, `productId`, `warehouseId`) and empty payload scenarios? [Completeness, Spec §FR-005, Spec §FR-007, Spec §FR-008, Spec §Edge Cases]
- [ ] CHK004 Are all response requirements specified for both success and failure shapes, including aggregated error payload content? [Completeness, Spec §FR-018, Spec §FR-023]

## Requirement Clarity

- [ ] CHK005 Is the aggregated validation error format unambiguous about required fields for each error item (`array`, zero-based `index`, field/message)? [Clarity, Spec §FR-023]
- [ ] CHK006 Is duplicate handling defined precisely enough to avoid interpretation drift (what is considered a duplicate and where)? [Clarity, Spec §FR-020, Spec §Clarifications]
- [ ] CHK007 Is `purchasePrice` meaning clearly defined as per-unit (not line-total) across quantity values greater than 1? [Clarity, Spec §Clarifications, Spec §FR-014, Spec §FR-015]
- [ ] CHK008 Is non-idempotent retry behavior explicitly stated in API requirements so clients can implement safe retry strategies? [Clarity, Spec §FR-022, Spec §Edge Cases]

## Requirement Consistency

- [ ] CHK009 Do assumptions, clarifications, and functional requirements consistently describe product-supplier behavior for `existingProducts` (no auto-create, non-blocking)? [Consistency, Spec §Assumptions, Spec §Clarifications, Spec §FR-013]
- [ ] CHK010 Are validation rules consistent between spec prose and contract artifacts for `purchasePrice`, `quantity`, and array item requirements? [Consistency, Spec §FR-003, Spec §FR-004, Spec §FR-009, Spec §FR-009A]
- [ ] CHK011 Are success response expectations consistent between user scenarios and formal API requirements (single stock entry with summary output)? [Consistency, Spec §User Story 3, Spec §FR-018]

## Acceptance Criteria Quality

- [ ] CHK012 Can each acceptance scenario be objectively evaluated with clear pass/fail outcomes for API behavior (especially mixed-array requests and rollback)? [Measurability, Spec §User Story 1, Spec §User Story 2, Spec §User Story 3]
- [ ] CHK013 Are status-code expectations explicitly defined for key failure classes (validation error, unauthorized, forbidden, not-found/conflict) or clearly delegated to shared API standards? [Acceptance Criteria, Gap]

## Scenario Coverage

- [ ] CHK014 Are primary, alternate, and exception API scenarios all represented (new-only, existing-only, mixed, invalid mixed payload)? [Coverage, Spec §User Story 1, Spec §User Story 2, Spec §User Story 3]
- [ ] CHK015 Are cross-array validation scenarios covered where multiple invalid items exist in different arrays in one request? [Coverage, Spec §FR-023, Spec §Edge Cases]
- [ ] CHK016 Are recovery/compensation requirements clear for partial-failure prevention (single transaction rollback scope)? [Coverage, Spec §FR-017]

## Dependencies & Assumptions

- [ ] CHK017 Are external dependency requirements explicit enough for API consumers (existing supplier, active warehouse, optional file ownership/validity constraints)? [Dependencies, Spec §Assumptions, Spec §FR-002, Spec §FR-008]
- [ ] CHK018 Is permission scope clearly specified for the endpoint, including requests containing `newProducts`? [Dependencies, Spec §FR-021]

## Ambiguities & Conflicts

- [ ] CHK019 Is a canonical API error envelope requirement explicitly referenced for this endpoint to avoid format drift from platform standards? [Ambiguity, Gap]
- [ ] CHK020 Are non-functional API requirements (e.g., maximum payload size and response-time expectation for aggregated validation) explicitly documented or intentionally out of scope? [Gap, Non-Functional]
