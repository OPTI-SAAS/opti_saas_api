# Feature Specification: Warehouse Stock Management

**Feature Branch**: `001-warehouse-stock-management`  
**Created**: 2026-03-01  
**Status**: Draft  
**Input**: User description: "We already have a product entity, but it's just a reference entity and not the instance itself. I want the user to be able to add stock for a specific product or products. Those product instances will live in a warehouse. I want to keep history of product instance inserts or movements between warehouses."

## Assumptions

- The existing **Product** entity (frames, lenses, contact lenses, clipons, accessories) remains a reference/catalog entity and is not modified by this feature.
- The existing **Warehouse** entity (with name, capacity, address, type, active status) is already managed separately. This feature leverages warehouses but does not change their CRUD.
- A "stock item" represents a physical unit of a catalog product that exists in a specific warehouse at a given time.
- Stock is tracked at the individual unit level (each stock item has its own identity), not just as an aggregate quantity, to support traceability and movement history.
- Each stock item is tied to exactly one warehouse at any point in time.
- Movement history is append-only and immutable — records are never edited or deleted once created.
- Users who manage stock have appropriate permissions granted through the existing role-authorization system.
- A product can have many stock items across multiple warehouses.
- When stock is added, the user specifies how many units to create for a given product in a given warehouse.
- A single stock addition operation (Stock Entry) can include multiple products across multiple warehouses.
- Each stock addition requires a file upload (e.g., invoice, delivery note) to justify the action. The file is attached to the Stock Entry.
- All stock items created in a single addition action are grouped under a Stock Entry, enabling traceability back to the originating action and its justification document.
- Each stock addition requires the user to select a supplier from whom the stock was received. The supplier is recorded at the Stock Entry level and applies to all stock items in that entry by default.
- Warehouse capacity (if defined) is advisory; the system warns but does not hard-block additions that exceed capacity.
- Stock item status lifecycle: created as **active** → can transition to **reserved** (held for pending operation) → back to **active** (released) or to **removed** (written off). Active stock items can also be directly removed. Removed is a terminal state.

## Clarifications

### Session 2026-03-01

- Q: Should stock removal/write-off be in scope or deferred? → A: In scope — users can remove/write-off stock with a reason (sold, damaged, lost, disposed).
- Q: What are the valid statuses for a product instance? → A: Three states — active (in warehouse), reserved (held for a pending operation), removed (written off).
- Q: Do product instances have a user-facing identifier (serial number, barcode)? → A: No — system-generated ID only (auto-generated UUID).
- Q: Canonical term — "product instance" or "stock item"? → A: "Stock Item" — retire "product instance" everywhere.
- Q: Should only active/reserved stock items block product deletion and warehouse deactivation? → A: Yes — only active and reserved items block; removed items (terminal state) do not prevent these operations.
- Clarification (user): When adding stock, the user uploads a file (e.g., invoice, delivery note) to justify/identify the stock action. All items created in a single stock addition action are grouped together under a "Stock Entry" so they can be identified as belonging to that action.
- Clarification (user): A stock addition can span multiple warehouses and multiple products in a single operation. For example: 5 of Product A to Warehouse X, 3 of Product B to Warehouse Y, and 2 of Product A to Warehouse Z — all submitted as one Stock Entry.
- Clarification (user): When adding stock, the user selects which supplier this stock was received from. The supplier is set at the Stock Entry level and applies by default to all stock items in that action. The existing Supplier entity is leveraged as-is.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Add Stock to a Warehouse (Priority: P1)

As an inventory manager, I want to add new stock items for one or more products into one or more warehouses, with a supplier selection and justification file, so that I can record newly received inventory with full traceability.

**Why this priority**: This is the foundational action — without the ability to add stock to a warehouse, no other inventory operations are possible.

**Independent Test**: Can be fully tested by selecting a supplier, selecting products, specifying quantities and target warehouses, uploading a justification file, and confirming the new stock items appear in the correct warehouses grouped under a single Stock Entry with the supplier recorded.

**Acceptance Scenarios**:

1. **Given** a product exists in the catalog and a warehouse is active, **When** the user selects a supplier, adds 10 units of that product to the warehouse with an uploaded invoice, **Then** 10 new stock items are created in that warehouse, grouped under a Stock Entry that references the uploaded file and the selected supplier.
2. **Given** the user selects a supplier and multiple products and multiple warehouses, **When** they submit a stock addition (e.g., 5 of Product A to Warehouse X, 3 of Product B to Warehouse Y, and 2 of Product A to Warehouse Z) with an uploaded delivery note, **Then** all stock items are created in their respective warehouses, grouped under a single Stock Entry with the attached file and the selected supplier.
3. **Given** a warehouse has a defined capacity of 100 and currently holds 95 items, **When** the user attempts to add 10 more items, **Then** the system warns the user that the addition exceeds capacity but still allows them to proceed if confirmed.
4. **Given** a warehouse is inactive, **When** the user attempts to add stock to it, **Then** the system rejects the operation with a clear error message.
5. **Given** the user attempts to submit a stock addition without uploading a justification file, **Then** the system rejects the operation and prompts the user to upload a file.
6. **Given** a Stock Entry was created, **When** the user views that Stock Entry, **Then** they can see all stock items created in that action, the supplier, the justification file, the timestamp, and the user who performed it.
7. **Given** the user attempts to submit a stock addition without selecting a supplier, **Then** the system rejects the operation and prompts the user to select a supplier.

---

### User Story 2 - View Stock in a Warehouse (Priority: P2)

As an inventory manager, I want to view all stock items currently stored in a specific warehouse so that I know what inventory is available.

**Why this priority**: Visibility into current stock is essential for day-to-day operations and precedes any movement or audit workflows.

**Independent Test**: Can be fully tested by navigating to a warehouse and seeing a list of all stock items, filterable by product type or product reference.

**Acceptance Scenarios**:

1. **Given** a warehouse contains stock items, **When** the user views that warehouse's stock, **Then** all stock items are listed showing the product name, designation, type, and the date the item was added.
2. **Given** a warehouse contains many stock items, **When** the user filters by product type or searches by product designation, **Then** only matching items are shown.
3. **Given** a warehouse has no stock, **When** the user views that warehouse's stock, **Then** an appropriate empty-state message is displayed.

---

### User Story 3 - Move Stock Between Warehouses (Priority: P3)

As an inventory manager, I want to transfer stock items from one warehouse to another so that I can redistribute inventory based on operational needs.

**Why this priority**: Movement between warehouses is a core inventory operation that enables flexible stock distribution and is required before audit/history tracking delivers full value.

**Independent Test**: Can be fully tested by selecting stock items in one warehouse, choosing a destination warehouse, confirming the transfer, and verifying the items now appear in the destination warehouse.

**Acceptance Scenarios**:

1. **Given** a stock item exists in Warehouse A, **When** the user transfers it to Warehouse B, **Then** the item is now associated with Warehouse B and no longer listed in Warehouse A.
2. **Given** the user selects multiple stock items in a warehouse, **When** they perform a bulk transfer to a different warehouse, **Then** all selected items are moved to the destination warehouse.
3. **Given** the destination warehouse is inactive, **When** the user attempts to move stock to it, **Then** the system rejects the operation with a clear error message.
4. **Given** the source and destination warehouses are the same, **When** the user attempts a transfer, **Then** the system rejects the operation indicating no movement is needed.

---

### User Story 4 - Remove / Write-Off Stock (Priority: P4)

As an inventory manager, I want to remove stock items from a warehouse with a recorded reason so that I can account for items that are sold, damaged, lost, or disposed of.

**Why this priority**: Without removal, warehouse stock counts only grow and never reflect reality. This completes the inventory lifecycle alongside addition and movement.

**Independent Test**: Can be fully tested by selecting stock items in a warehouse, choosing a removal reason, confirming the operation, and verifying the items are no longer listed as active stock.

**Acceptance Scenarios**:

1. **Given** a stock item exists in a warehouse, **When** the user removes it with the reason "sold", **Then** the item is no longer listed in the warehouse's active stock and a history entry is recorded with the reason.
2. **Given** the user selects multiple stock items, **When** they perform a bulk removal with the reason "damaged", **Then** all selected items are removed and history entries are created for each.
3. **Given** a removal is performed, **When** the user views the movement history for that item, **Then** the removal event appears with the reason, timestamp, and user who performed it.
4. **Given** the user attempts to remove a stock item that has already been removed, **Then** the system rejects the operation with a clear error message.

---

### User Story 5 - View Stock Movement History (Priority: P5)

As an inventory manager, I want to view the full movement history of stock items so that I can audit where stock has been over time.

**Why this priority**: Historical traceability is critical for accountability and operational auditing, but depends on stock addition and movement being in place first.

**Independent Test**: Can be fully tested by adding stock, moving it between warehouses, and then viewing the history log to confirm all events appear chronologically.

**Acceptance Scenarios**:

1. **Given** a stock item was added to Warehouse A, moved to Warehouse B, and later removed as "sold", **When** the user views the movement history for that item, **Then** the history shows: (1) creation/addition in Warehouse A with timestamp and user, (2) transfer from Warehouse A to Warehouse B with timestamp and user, (3) removal from Warehouse B with reason "sold", timestamp, and user.
2. **Given** a warehouse has had stock additions and removals, **When** the user views the warehouse-level movement history, **Then** all stock events for that warehouse are listed in reverse chronological order.
3. **Given** a product has stock items spread across multiple warehouses, **When** the user views the product-level stock history, **Then** all events across all warehouses for that product are consolidated and shown chronologically.

---

### Edge Cases

- What happens when a product is deleted from the catalog while stock items still exist in warehouses? The system should prevent deletion or require all stock items to be removed first.
- What happens when a warehouse is deactivated while it still contains stock items? The system should warn the user and require stock to be moved out before deactivation, or at minimum flag the warehouse as containing orphaned stock.
- What happens when the user tries to move a stock item that is already being moved (concurrent operation)? The system should handle this gracefully with optimistic locking or a conflict error.
- What happens when a bulk addition contains zero quantity for a product? The system should reject entries with a quantity of zero or less.
- What happens when the uploaded justification file is invalid or too large? The system should enforce file type and size constraints and reject with a clear error.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST allow users to create stock items by selecting one or more products from the catalog, specifying quantities, and assigning them to one or more active warehouses in a single operation.
- **FR-002**: System MUST support adding stock for multiple products across multiple warehouses in a single Stock Entry (e.g., Product A to Warehouse X, Product B to Warehouse Y).
- **FR-002b**: System MUST require a file upload (e.g., invoice, delivery note) for every stock addition. The file is attached to the Stock Entry as justification.
- **FR-002c**: System MUST group all stock items created in a single addition operation under a Stock Entry, enabling users to identify which items were added together and view the associated justification file.
- **FR-002d**: System MUST require the user to select a supplier for every stock addition. The supplier is recorded at the Stock Entry level and applies to all stock items in that entry by default.
- **FR-003**: System MUST associate each stock item with exactly one warehouse at any point in time.
- **FR-004**: System MUST allow users to transfer one or more stock items from one active warehouse to another active warehouse.
- **FR-005**: System MUST prevent stock transfers where the source and destination warehouse are the same.
- **FR-006**: System MUST prevent stock additions or transfers to inactive warehouses.
- **FR-007**: System MUST record a history entry every time a stock item is created (added to a warehouse).
- **FR-008**: System MUST record a history entry every time a stock item is moved from one warehouse to another, capturing the source warehouse, destination warehouse, timestamp, and the user who performed the action.
- **FR-008b**: System MUST allow users to remove/write-off one or more stock items from a warehouse, requiring a reason (sold, damaged, lost, or disposed).
- **FR-008c**: System MUST record a history entry every time a stock item is removed, capturing the warehouse, removal reason, timestamp, and the user who performed the action.
- **FR-008d**: System MUST prevent removal of a stock item that has already been removed.
- **FR-009**: System MUST allow users to view all stock items currently in a given warehouse, with filtering and pagination support.
- **FR-010**: System MUST allow users to view the movement history of a specific stock item, showing all events in chronological order.
- **FR-011**: System MUST allow users to view movement history at the warehouse level (all stock events for a warehouse).
- **FR-012**: System MUST issue a warning when a stock addition would cause a warehouse to exceed its defined capacity, but allow the user to proceed after confirmation.
- **FR-013**: System MUST ensure movement history records are immutable — they cannot be edited or deleted.
- **FR-014**: System MUST prevent deletion of a product from the catalog if active or reserved stock items still exist for that product in any warehouse (removed items do not block deletion).
- **FR-015**: System MUST prevent deactivation of a warehouse if it still contains active or reserved stock items (removed items do not block deactivation).

### Key Entities

- **Stock Item**: Represents a physical unit of a catalog product (formerly referred to as "product instance"). Belongs to exactly one warehouse. Key attributes: system-generated UUID (no user-facing serial number or barcode), reference to the catalog product, reference to the current warehouse, reference to the Stock Entry that created it, date of creation, and status. Status values: **active** (currently in a warehouse and available), **reserved** (held for a pending operation such as a future sale or order), **removed** (written off — sold, damaged, lost, or disposed). Only active items can be moved or removed. Reserved items cannot be moved or removed until released back to active.
- **Stock Entry**: Groups all stock items created in a single addition action. Key attributes: system-generated UUID, reference to the supplier from whom the stock was received, reference to the uploaded justification file, timestamp of creation, the user who performed the action, and a list of line items (each specifying a product, a warehouse, and a quantity).
- **Stock Movement History**: An immutable record of a stock event. Key attributes: reference to the stock item, event type (addition, transfer, or removal), source warehouse (null for additions), destination warehouse (null for removals), removal reason (null unless event type is removal; one of: sold, damaged, lost, disposed), reference to the Stock Entry (for addition events), timestamp, and the user who performed the action.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can add stock for one or more products across one or more warehouses in under 2 minutes, including file upload.
- **SC-002**: Users can transfer stock between warehouses in under 1 minute per batch operation.
- **SC-003**: The full movement history for any stock item is retrievable and displays all events within 2 seconds.
- **SC-004**: 100% of stock additions and transfers are recorded in the movement history with no gaps.
- **SC-005**: Warehouse stock view supports pagination and filtering, returning results within 2 seconds for warehouses with up to 10,000 items.
- **SC-006**: Users successfully complete a stock addition on first attempt at least 90% of the time without external guidance.
