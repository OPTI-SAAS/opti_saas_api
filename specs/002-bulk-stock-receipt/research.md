# Phase 0 Research: Bulk Stock Receipt

## Decision 1: Use a single transactional command for both arrays

- **Decision**: Implement one atomic bulk receipt use case that processes `newProducts` and `existingProducts` inside a single DB transaction.
- **Rationale**: The spec requires rollback on any failure and grouping all created stock items under one stock entry.
- **Alternatives considered**:
  - Two separate endpoints (create-then-fill) — rejected: does not satisfy single-operation requirement and increases partial-write risk.
  - Sequential non-transactional processing — rejected: violates atomicity requirement.

## Decision 2: Persist per-unit `purchasePrice` on both `stock_entry_lines` and `stock_items`

- **Decision**: Add `purchasePrice` column to both entities and write the same per-unit value to each generated stock item for a given line.
- **Rationale**: Clarified requirement states that purchase price is per unit even when `quantity > 1`, and must exist on both line and item records.
- **Alternatives considered**:
  - Store only line-level price — rejected: item-level traceability and downstream per-item calculations would be weaker.
  - Store only total line amount — rejected: contradicts per-unit requirement.

## Decision 3: Aggregate validation errors with array + index metadata

- **Decision**: Validate entire payload and return all errors in one response with `{ array, index, field, message }` semantics.
- **Rationale**: Product requirement asks for complete error list with item location in either `newProducts` or `existingProducts`.
- **Alternatives considered**:
  - Fail-fast first error only — rejected: poor UX for bulk payload correction.
  - Return only field messages without array/index — rejected: insufficient for client-side mapping.

## Decision 4: Reject duplicate `existingProducts` pairs by (`productId`, `warehouseId`)

- **Decision**: Detect duplicates in request validation and reject with HTTP 400.
- **Rationale**: Explicit clarification selected this behavior; avoids ambiguity in line semantics and supports deterministic stock entry lines.
- **Alternatives considered**:
  - Merge duplicates by summing quantity — rejected by product decision.
  - Allow duplicates and create separate lines — rejected due to business ambiguity and table uniqueness constraints.

## Decision 5: Product-supplier handling rules remain asymmetric by array type

- **Decision**: Create `ProductSupplier` links for `newProducts` only; do not auto-create for `existingProducts`.
- **Rationale**: Matches clarifications and prevents hidden side effects when receiving stock for already-known products.
- **Alternatives considered**:
  - Auto-create missing links for existing products — rejected by product decision.
  - Block fill if missing link — rejected to preserve operational flow.

## Decision 6: Keep non-idempotent retry behavior in MVP

- **Decision**: Endpoint remains non-idempotent; retries after timeout can create additional stock entries/items.
- **Rationale**: Explicitly chosen in clarification to reduce scope and avoid introducing idempotency-key infrastructure.
- **Alternatives considered**:
  - Mandatory idempotency key — rejected as out of current scope.
  - Optional idempotency mode — rejected to keep contract simple.

## Decision 7: Authorization scope uses stock-entry permission only

- **Decision**: Require stock-entry creation permission regardless of `newProducts` presence.
- **Rationale**: Chosen clarification avoids coupling this flow to separate product-create role checks.
- **Alternatives considered**:
  - Require both stock and product-create permissions when `newProducts` is non-empty — rejected by product decision.
  - Split permission by array presence — rejected to keep policy straightforward.

## Decision 8: Contract-first API definition via OpenAPI artifact

- **Decision**: Add a dedicated contract file for this endpoint documenting request schema, success envelope, and aggregated validation error shape.
- **Rationale**: The feature exposes an external API interface and needs precise implementation/test alignment.
- **Alternatives considered**:
  - Rely only on prose in spec — rejected: less testable and more ambiguous.
  - Delay contract until implementation — rejected: increases mismatch risk.
