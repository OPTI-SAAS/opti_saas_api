# Validation Requirements Checklist: Bulk Stock Receipt

**Purpose**: Validate the quality of validation-related requirements before implementation.
**Created**: 2026-03-01
**Feature**: [spec.md](../spec.md)

## Requirement Completeness

- [ ] CHK001 Are required-vs-optional validation rules fully specified for top-level fields (`supplierId`, `fileId`, `newProducts`, `existingProducts`)? [Completeness, Spec §FR-001, Spec §FR-002, Spec §FR-003, Spec §FR-004]
- [ ] CHK002 Are item-level required-field rules fully specified for both arrays, including `quantity` and per-unit `purchasePrice`? [Completeness, Spec §FR-003, Spec §FR-004, Spec §FR-009, Spec §FR-009A]
- [ ] CHK003 Are existence/validity checks complete for all referenced IDs (`supplierId`, `productId`, `warehouseId`) and warehouse active-state constraints? [Completeness, Spec §FR-007, Spec §FR-008, Spec §Edge Cases]
- [ ] CHK004 Are empty-payload requirements explicit when both arrays are missing/empty? [Completeness, Spec §FR-005, Spec §User Story 3]

## Requirement Clarity

- [ ] CHK005 Is duplicate detection scope precisely defined for `existingProducts` as (`productId`, `warehouseId`) within one request? [Clarity, Spec §FR-020, Spec §Clarifications]
- [ ] CHK006 Is `purchasePrice` validation unambiguous about units (per-item unit price, not line total) and allowed numeric range? [Clarity, Spec §Clarifications, Spec §FR-009A]
- [ ] CHK007 Is the aggregated error requirement clear that responses include all validation errors rather than first-error only? [Clarity, Spec §FR-023]
- [ ] CHK008 Is error location metadata explicitly defined as source array plus zero-based item index? [Clarity, Spec §FR-023, Spec §Clarifications]

## Requirement Consistency

- [ ] CHK009 Do edge cases, clarifications, and functional requirements consistently describe invalid-quantity and invalid-purchasePrice behavior? [Consistency, Spec §Edge Cases, Spec §FR-009, Spec §FR-009A]
- [ ] CHK010 Do user scenarios and formal requirements consistently describe validation rollback outcomes (no partial writes)? [Consistency, Spec §User Story 1, Spec §User Story 3, Spec §FR-017]
- [ ] CHK011 Are validation requirements consistent between prose spec and API contract for required fields and minimum constraints? [Consistency, Spec §FR-003, Spec §FR-004, Spec §FR-023]

## Scenario Coverage

- [ ] CHK012 Are multi-error scenarios across both arrays explicitly addressed in requirements (alternate + exception flow)? [Coverage, Spec §Edge Cases, Spec §FR-023]
- [ ] CHK013 Are conflict-vs-validation boundaries clearly specified (e.g., duplicate internalCode conflict vs schema validation)? [Coverage, Spec §Edge Cases, Spec §FR-006]

## Ambiguities & Assumptions

- [ ] CHK014 Is the standardized error envelope for validation failures explicitly anchored (or intentionally delegated) to avoid format ambiguity? [Ambiguity, Gap]
