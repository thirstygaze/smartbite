# SmartBite Database Dictionary & Technical Catalog
**Course:** Advanced Database Systems (3rd Year IT)  
**Database Engine:** PostgreSQL 15+ (Hosted on Supabase Cloud)  
**Standard Compliance:** Third Normal Form (3NF), ACID Compliant, RBAC Enforced  

---

## 1. Schema Entity Relationship Overview (10 Normalized Tables)

| # | Table Name | Type | Description | Relational Integrity |
|---|---|---|---|---|
| 1 | `profiles` | Strong Entity | User identity & credentials separation | PK `id` references `auth.users(id)` ON DELETE CASCADE |
| 2 | `stalls` | Strong Entity | Multi-tenant canteen vendors | PK `id`, FK `manager_id` references `profiles(id)` |
| 3 | `categories` | Strong Entity | Stall menu categories | PK `id`, FK `stall_id` references `stalls(id)` ON DELETE CASCADE |
| 4 | `menu_items` | Strong Entity | Canteen food items in 3NF | PK `id`, FKs to `stalls` and `categories` ON DELETE RESTRICT |
| 5 | `inventory_items` | Strong Entity | Raw material stock and threshold levels | PK `id`, FK `stall_id` references `stalls(id)` ON DELETE CASCADE |
| 6 | `menu_item_ingredients` | **Junction (N:M)** | Maps Menu Items to required Raw Ingredients | FK `menu_item_id` ON DELETE CASCADE, FK `inventory_item_id` ON DELETE RESTRICT |
| 7 | `stall_staff` | **Junction (N:M)** | Maps Canteen Stalls to Staff Profiles | FK `stall_id` ON DELETE CASCADE, FK `profile_id` ON DELETE CASCADE |
| 8 | `orders` | Strong Entity | Order header record | PK `id`, FK `student_id` ON DELETE SET NULL, FK `stall_id` ON DELETE RESTRICT |
| 9 | `order_items` | **Junction (N:M)** | Maps Orders to Menu Items (Atomic 3NF) | FK `order_id` ON DELETE CASCADE, FK `menu_item_id` ON DELETE RESTRICT |
| 10 | `audit_logs` | Audit Engine | Captures row mutations via triggers | Auto-populated by PostgreSQL triggers |

---

## 2. Detailed Data Dictionary

### Table 1: `profiles`
*Separates authentication credentials from system profile data (3NF).*
- `id` (UUID, PK): Unique user ID mapped to `auth.users`.
- `student_id` (TEXT, UNIQUE, NOT NULL): Official student or staff ID number.
- `full_name` (TEXT, NOT NULL): Full name of the user.
- `grade_or_dept` (TEXT): Academic grade level or department.
- `role` (TEXT, NOT NULL): Role tier: `'student'`, `'staff'`, `'admin'`.
- `balance` (NUMERIC(10,2)): Student digital wallet balance (CHECK `balance >= 0`).
- `created_at` (TIMESTAMPTZ): Account registration timestamp.

### Table 2: `stalls`
*Provides multi-tenant data isolation for independent canteen vendors.*
- `id` (BIGSERIAL, PK): Unique stall identifier.
- `name` (TEXT, UNIQUE, NOT NULL): Vendor trade name.
- `stall_code` (TEXT, UNIQUE, NOT NULL): Identifier code (e.g. `STALL-01`).
- `manager_id` (UUID, FK -> `profiles.id`): Profile managing this stall.
- `is_open` (BOOLEAN): Current operational status.
- `rating` (NUMERIC(3,2)): Vendor quality rating (1.0 to 5.0).

### Table 3: `categories`
- `id` (BIGSERIAL, PK): Unique category ID.
- `stall_id` (BIGINT, FK -> `stalls.id` ON DELETE CASCADE): Parent stall.
- `name` (TEXT, NOT NULL): Category title (Rice Meals, Drinks, Snacks, etc.).
- `display_order` (INT): Presentation ordering weight.

### Table 4: `menu_items`
- `id` (BIGSERIAL, PK): Food item ID.
- `stall_id` (BIGINT, FK -> `stalls.id` ON DELETE RESTRICT): Parent stall.
- `category_id` (BIGINT, FK -> `categories.id` ON DELETE RESTRICT): Parent category.
- `name` (TEXT, NOT NULL): Product name.
- `description` (TEXT): Detailed description.
- `price` (NUMERIC(10,2), NOT NULL CHECK `price > 0`): Selling price.
- `preparation_time_minutes` (INT): Standard cook time.
- `image_url` (TEXT, NOT NULL): Image asset URL.
- `is_available` (BOOLEAN): In-stock toggle.

### Table 5: `inventory_items`
*Core supply chain and inventory management entity.*
- `id` (BIGSERIAL, PK): Ingredient identifier.
- `stall_id` (BIGINT, FK -> `stalls.id` ON DELETE CASCADE): Owner stall.
- `item_name` (TEXT, NOT NULL): Raw item name (e.g., Chicken cuts, Rice, Oil).
- `unit_of_measure` (TEXT, CHECK IN `'kg'`, `'grams'`, `'pieces'`, `'liters'`, `'servings'`).
- `current_stock` (NUMERIC(10,2), NOT NULL CHECK `>= 0`): Live available stock balance.
- `minimum_threshold` (NUMERIC(10,2)): Safety stock level triggering low-stock alert.
- `reorder_quantity` (NUMERIC(10,2)): Standard replenishment batch size.
- `last_restocked_at` (TIMESTAMPTZ): Timestamp of last supplier delivery.

### Table 6: `menu_item_ingredients` (Junction Table 1)
*Resolves N:M relationship between Menu Items and Raw Ingredients.*
- `id` (BIGSERIAL, PK): Unique recipe junction ID.
- `menu_item_id` (BIGINT, FK -> `menu_items.id` ON DELETE CASCADE): Product ID.
- `inventory_item_id` (BIGINT, FK -> `inventory_items.id` ON DELETE RESTRICT): Raw material ID.
- `quantity_required` (NUMERIC(8,2), NOT NULL): Amount depleted per order unit.
- `unit` (TEXT, NOT NULL): Measurement unit matching inventory.
- `is_critical` (BOOLEAN): Flags recipe-critical components.

### Table 7: `stall_staff` (Junction Table 2)
*Resolves N:M relationship between Stalls and Staff Profiles.*
- `id` (BIGSERIAL, PK): Shift assignment ID.
- `stall_id` (BIGINT, FK -> `stalls.id` ON DELETE CASCADE): Stall identifier.
- `profile_id` (UUID, FK -> `profiles.id` ON DELETE CASCADE): Assigned staff user.
- `role_title` (TEXT, CHECK IN `'Manager'`, `'Chef'`, `'Cashier'`, `'Kitchen Staff'`).
- `shift_schedule` (TEXT): Scheduled duty hours.
- `is_on_duty` (BOOLEAN): Live duty status.

### Table 8: `orders`
- `id` (TEXT, PK): Formatted order ticket number (e.g. `SB-2048`).
- `student_id` (UUID, FK -> `profiles.id` ON DELETE SET NULL): Ordering user.
- `stall_id` (BIGINT, FK -> `stalls.id` ON DELETE RESTRICT): Target stall.
- `student_number` (TEXT, NOT NULL): Physical student ID card number.
- `student_name` (TEXT, NOT NULL): Student name for pickup announcement.
- `subtotal` (NUMERIC(10,2), NOT NULL): Pre-fee order amount.
- `service_fee` (NUMERIC(10,2), DEFAULT 0.00): School canteen platform fee.
- `total_amount` (NUMERIC(10,2), NOT NULL): Net payable amount.
- `order_status` (TEXT, CHECK IN `'Order placed'`, `'Preparing'`, `'Ready for pickup'`, `'Completed'`, `'Cancelled'`).
- `pickup_time` (TEXT): Estimated preparation window.
- `payment_method` (TEXT, CHECK IN `'Cash at counter'`, `'Student Wallet'`, `'GCash'`, `'Maya'`).
- `payment_status` (TEXT, CHECK IN `'pending'`, `'paid'`, `'refunded'`).
- `created_at` (TIMESTAMPTZ): Order timestamp.
- `updated_at` (TIMESTAMPTZ): Status transition timestamp.

### Table 9: `order_items` (Junction Table 3)
*Resolves N:M relationship between Orders and Menu Items in strict 3NF (replaces JSON arrays).*
- `id` (BIGSERIAL, PK): Item line ID.
- `order_id` (TEXT, FK -> `orders.id` ON DELETE CASCADE): Parent order ticket.
- `menu_item_id` (BIGINT, FK -> `menu_items.id` ON DELETE RESTRICT): Ordered catalog item.
- `item_name` (TEXT, NOT NULL): Historic name snapshot.
- `quantity` (INT, NOT NULL CHECK `quantity > 0`): Quantity ordered.
- `unit_price` (NUMERIC(10,2), NOT NULL): Locked unit price snapshot.
- `item_subtotal` (NUMERIC(10,2), NOT NULL): Line total (`unit_price * quantity`).
- `special_instructions` (TEXT): Dietary or spice notes.
- `item_status` (TEXT, DEFAULT `'pending'`).

### Table 10: `audit_logs`
*System audit engine populated exclusively by PostgreSQL engine triggers.*
- `id` (BIGSERIAL, PK): Audit sequence identifier.
- `table_name` (TEXT, NOT NULL): Source mutated table name.
- `record_id` (TEXT, NOT NULL): Primary key value of modified row.
- `action` (TEXT, CHECK IN `'INSERT'`, `'UPDATE'`, `'DELETE'`).
- `performed_by` (UUID): User or system execution identity.
- `old_data` (JSONB): Pre-mutation state snapshot.
- `new_data` (JSONB): Post-mutation state snapshot.
- `change_summary` (TEXT): Generated human-readable description.
- `created_at` (TIMESTAMPTZ): Transaction timestamp.

---

## 3. Server-Side Data Automation

### Triggers
1. **`trg_audit_orders`**: Captures all insert, update, and delete actions on `orders` and logs them into `audit_logs`.
2. **`trg_audit_inventory`**: Tracks real-time ingredient level adjustments into `audit_logs`.
3. **`trg_order_item_deduct_inventory`**: Automatically decrements the required raw materials in `inventory_items` by joining against `menu_item_ingredients` whenever a new `order_item` row is inserted.

### Stored Procedures / Functions
1. **`sp_place_canteen_order`**: Executes an atomic transaction verifying stall status, checking menu availability, inserting the order header, inserting order items, and invoking automatic inventory depletion.
2. **`sp_update_order_status`**: Enforces valid state transitions (`Order placed` -> `Preparing` -> `Ready for pickup` -> `Completed`).
3. **`sp_restock_inventory`**: Bulk ingredient replenishment with verification and audit logging.
