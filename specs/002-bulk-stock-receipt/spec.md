# Feature Specification: Bulk Stock Receipt

**Feature Branch**: `002-bulk-stock-receipt`  
**Created**: 2026-03-01  
**Status**: Draft  
**Input**: User description: "Endpoint where user sends supplierId, then two arrays: one array with payload for both product creation and stock item filling of those created products, the other array is simple stock item filling where they provide the productId already"

## Assumptions

- This feature builds on the existing Stock Entry system from feature 001 (warehouse-stock-management). A Stock Entry groups stock additions under a single supplier with an optional justification file.
- The endpoint creates a single Stock Entry record for the entire operation, grouping all created stock items (from both arrays) under one entry.
- Products created via the first array (new products) follow the same validation rules as the existing product creation flow (product type, pricing mode, designation, etc.).
- The supplier referenced by `supplierId` must already exist in the system.
- Each line in both arrays specifies a `warehouseId` and `quantity` — the system creates that many individual stock items for the product in that warehouse.
- Each line in both arrays specifies a per-unit `purchasePrice`; this value is stored on each created stock item and on the stock entry line.
- A product-supplier link (ClProductSupplier) is automatically established for newly created products, using the `supplierId` from the request. Users may provide a `productReferanceCode` for each new product.
- A product-supplier link (ClProductSupplier) is automatically established for newly created products, using the `supplierId` from the request; `productReferanceCode` is optional and may be null/empty.
- For existing products (second array), missing product-supplier links do not block stock fill and are not auto-created by this endpoint.
- The optional justification file (`fileId`) is attached at the Stock Entry level, consistent with the existing stock entry pattern.
- The operation is atomic: if any product creation or stock item filling fails, the entire request is rolled back.
- The endpoint is non-idempotent in MVP scope: retrying the same successful request may create additional stock entries/items.
- Warehouse capacity warnings (advisory, not blocking) still apply per the existing behavior.
- Stock items are created with status `active` by default.
- Movement history records of type `entry` are created for each stock item, consistent with existing behavior.

## Clarifications

### Session 2026-03-01

- Q: How should duplicate `productId + warehouseId` pairs in one request be handled? → A: Reject duplicates with a 400 validation error.
- Q: How should Product-Supplier links be handled for `existingProducts` when missing? → A: Do not create missing links; stock fill still proceeds.
- Q: What permission model should apply when `newProducts` is present? → A: Require stock-entry permission only.
- Q: Should this endpoint support idempotency keys for safe retries in MVP? → A: No idempotency handling in this feature; retries may create additional stock entries/items.
- Q: For `newProducts`, is `productReferanceCode` required? → A: Optional; null/empty is allowed.
- Q: How should purchase price be stored when quantity is 1 or more? → A: Per-unit purchase price is sent on each item and stored on both Stock Item and Stock Entry Line.
- Q: How should validation errors be returned for array items? → A: Return all validation errors with array name and item index for each error.

## User Scenarios & Testing _(mandatory)_

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Receive Stock with New Products (Priority: P1)

As an inventory manager receiving a delivery from a supplier, I want to create new products and immediately record their stock in one operation, so that I can register products that don't yet exist in the catalog and add their physical units to the warehouse in a single step.

**Why this priority**: This is the primary use case — when receiving goods from a supplier that include products not yet in the system, the user needs to create product references and stock entries together, rather than performing two separate operations.

**Independent Test**: Can be fully tested by sending a request with a valid `supplierId`, a `newProducts` array containing product details (designation, product type, pricing, quantity, warehouse), and verifying that: products are created in the catalog, stock items appear in the target warehouse, a stock entry groups everything, and a product-supplier link is established.

**Acceptance Scenarios**:

1. **Given** a valid supplier exists and the user provides a `newProducts` array with one product (including designation, type, pricing mode, quantity: 5, warehouseId), **When** the endpoint is called, **Then** the product is created, 5 stock items are created in the specified warehouse with status `active`, a stock entry is created linking all items to the supplier, stock entry lines reflect the quantity, and a product-supplier link is established.
2. **Given** a valid supplier exists and the user provides a `newProducts` array with 3 different products each going to different warehouses, **When** the endpoint is called, **Then** all 3 products are created, stock items are created in the correct warehouses, and all are grouped under a single stock entry.
3. **Given** any product in the `newProducts` array has invalid or missing required fields (e.g., missing designation, invalid pricing mode), **When** the endpoint is called, **Then** the entire request is rejected with validation errors and no products or stock items are created, and the response includes all detected errors with `array: newProducts` and the failing `index`.

---

### User Story 2 - Receive Stock for Existing Products (Priority: P1)

As an inventory manager receiving a delivery from a supplier, I want to add stock for products that already exist in the catalog by referencing their product IDs, so that I can quickly record incoming inventory without re-entering product details.

**Why this priority**: Equally critical as Story 1 — most stock receipts will reference existing products. This is the simpler, more frequent use case.

**Independent Test**: Can be fully tested by sending a request with a valid `supplierId`, an `existingProducts` array containing entries with `productId`, `quantity`, and `warehouseId`, and verifying stock items are created correctly under a stock entry.

**Acceptance Scenarios**:

1. **Given** a valid supplier and existing product, the user provides an `existingProducts` array with one entry (productId, quantity: 10, warehouseId), **When** the endpoint is called, **Then** 10 stock items are created for that product in the specified warehouse, a stock entry is created, and stock fill proceeds even if a product-supplier link for that pair is missing.
2. **Given** a valid supplier and multiple existing products, the user provides entries for 3 products across 2 warehouses, **When** the endpoint is called, **Then** all stock items are created in the correct warehouses under a single stock entry.
3. **Given** the user provides a `productId` that does not exist, **When** the endpoint is called, **Then** the entire request is rejected with an error indicating the product was not found.

---

### User Story 3 - Mixed Receipt: New and Existing Products Together (Priority: P1)

As an inventory manager receiving a delivery that contains both new products and restocked existing products, I want to handle both in a single request, so that I can process an entire delivery in one operation.

**Why this priority**: This is the combined use case and the full endpoint behavior — a single delivery from a supplier often contains a mix of new products and restocked existing ones.

**Independent Test**: Can be fully tested by sending both `newProducts` and `existingProducts` arrays in a single request and verifying all products and stock items are created correctly under one stock entry.

**Acceptance Scenarios**:

1. **Given** a valid supplier, the user provides a `newProducts` array with 2 new products and an `existingProducts` array with 3 existing products, **When** the endpoint is called, **Then** all 2 new products are created, stock items for all 5 product lines are created in the correct warehouses, and everything is grouped under a single stock entry.
2. **Given** both arrays are empty, **When** the endpoint is called, **Then** the request is rejected with a validation error indicating at least one product line is required.
3. **Given** one new product fails validation but existing products are valid, **When** the endpoint is called, **Then** the entire request is rolled back — no products or stock items are created (atomic operation).

---

### Edge Cases

- What happens when the `supplierId` does not exist? The request is rejected with a "supplier not found" error.
- What happens when a `warehouseId` does not exist or the warehouse is inactive? The request is rejected with an appropriate error indicating the warehouse is invalid or inactive.
- What happens when `quantity` is zero or negative? The request is rejected with a validation error — quantity must be a positive integer.
- What happens when `purchasePrice` is missing or negative? The request is rejected with a validation error — `purchasePrice` is required and must be a non-negative number.
- What happens when multiple items across arrays are invalid in the same request? The response returns all detected validation errors, each including the source array (`newProducts` or `existingProducts`) and item index.
- What happens when both `newProducts` and `existingProducts` arrays are empty? The request is rejected — at least one line item is required.
- What happens when a new product has the same `internalCode` as an existing product? The request is rejected with a conflict error indicating the product code already exists.
- What happens when `productReferanceCode` is missing or empty for a `newProducts` item? The product and stock fill still proceed; the created product-supplier link stores a null/empty reference code.
- What happens when the same `productId` appears multiple times in the `existingProducts` array with different warehouses? Each entry is processed independently — stock items are created in each specified warehouse.
- What happens when the same `productId` appears multiple times for the same warehouse? The request is rejected with a 400 validation error due to duplicate `productId + warehouseId` pairs.
- What happens when a warehouse's capacity would be exceeded? The system issues a warning but does not block the operation (advisory capacity, per existing behavior).
- What happens when a client retries the same request after a network timeout? The endpoint does not deduplicate in MVP; if the first request succeeded, retrying may create additional stock entries/items.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST accept a single `supplierId` that applies to the entire stock receipt operation.
- **FR-002**: System MUST accept an optional `fileId` for attaching a justification document (invoice, delivery note) to the stock entry.
- **FR-003**: System MUST accept a `newProducts` array where each entry contains full product creation details (designation, product type, pricing mode, pricing parameters, brand, model, etc.) plus stock filling details (`warehouseId`, `quantity`, required per-unit `purchasePrice`, and optional `productReferanceCode` for the supplier link).
- **FR-004**: System MUST accept an `existingProducts` array where each entry contains a `productId`, `warehouseId`, `quantity`, and required per-unit `purchasePrice`.
- **FR-005**: System MUST validate that both arrays are not simultaneously empty — at least one line item is required.
- **FR-006**: System MUST validate all product creation fields in the `newProducts` array using the same rules as standard product creation (required fields, pricing mode consistency, etc.).
- **FR-007**: System MUST validate that all referenced `productId` values in the `existingProducts` array correspond to existing products.
- **FR-008**: System MUST validate that all referenced `warehouseId` values correspond to existing, active warehouses.
- **FR-009**: System MUST validate that all `quantity` values are positive integers.
- **FR-009A**: System MUST validate that all `purchasePrice` values are present and are non-negative numbers.
- **FR-010**: System MUST create a single Stock Entry record for the entire operation, linked to the supplier and optional file.
- **FR-011**: System MUST create the new products from the `newProducts` array before creating their stock items.
- **FR-012**: System MUST create a Product-Supplier link for each new product, using the `supplierId` and an optional `productReferanceCode` (null/empty allowed).
- **FR-013**: System MUST NOT create Product-Supplier links for `existingProducts`; stock fill proceeds regardless of whether a product-supplier link already exists.
- **FR-014**: System MUST create Stock Entry Lines for each product-warehouse-quantity combination and persist the per-unit `purchasePrice` on each line.
- **FR-015**: System MUST create the specified number of individual stock items (per `quantity`) for each line, with status `active`, linked to the stock entry, product, and warehouse, and persist the same per-unit `purchasePrice` on each created stock item.
- **FR-016**: System MUST create a movement history record (type `entry`) for each stock item created.
- **FR-017**: System MUST execute the entire operation atomically — if any step fails, all changes are rolled back.
- **FR-018**: System MUST return the created Stock Entry with its lines and summary of created products and stock items in the response.
- **FR-019**: System MUST record the authenticated user as the `createdByUserId` on the Stock Entry and `performedByUserId` on movement history records.
- **FR-020**: System MUST reject requests that contain duplicate `productId + warehouseId` pairs in `existingProducts` with a 400 validation error.
- **FR-021**: System MUST require stock-entry creation permission only for this endpoint, including requests that contain `newProducts`.
- **FR-022**: System MUST NOT perform idempotency deduplication in MVP scope; repeated successful requests are treated as new stock receipt operations.
- **FR-023**: System MUST return aggregated validation errors (not first-error only); each error item MUST include the source array name (`newProducts` or `existingProducts`) and the zero-based index of the failing item.

### Key Entities

- **Stock Entry**: Groups all stock items from a single receipt operation. Linked to one supplier and an optional justification file. Contains multiple stock entry lines. Created with the submitting user's ID.
- **Stock Entry Line**: Represents a single product-warehouse-quantity combination within a stock entry. Records how many units of a specific product were received into a specific warehouse and stores the per-unit `purchasePrice` for that line.
- **Stock Item**: An individual physical unit of a product residing in a warehouse. Created with status `active`. Linked to its stock entry for traceability and stores its per-unit `purchasePrice`.
- **Product**: The catalog reference entity. New products are created from the `newProducts` array with all standard product fields.
- **Product-Supplier**: Links a product to a supplier with a reference code. Created automatically for new products only by this endpoint.
- **Stock Movement History**: An immutable record of each stock item's creation (entry type), storing the target warehouse and the user who performed the action.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can process a complete delivery (mix of new and existing products, multiple warehouses) in a single request, reducing the number of steps compared to creating products separately and then adding stock.
- **SC-002**: 100% of stock items created through this endpoint are traceable back to their originating stock entry, supplier, and justification document.
- **SC-003**: Failed requests result in zero partial data — no orphaned products, stock items, or stock entries exist after a failed operation.
- **SC-004**: Users can submit a receipt with up to 50 product lines (combined new and existing) and the operation completes successfully.
- **SC-005**: All created stock items have corresponding movement history records, maintaining full audit trail consistency.
