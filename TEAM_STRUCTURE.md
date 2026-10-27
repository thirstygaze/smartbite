# Team Structure & Operational Blueprint
**Course:** Advanced Database Systems  
**Project:** SmartBite Multi-Stall Canteen Food Hub & Inventory Engine  
**Team Structure:** 3 Members per Group (Section II Compliance)  

---

## Member 1: Lead Database Administrator (DBA) & Cloud Infrastructure Engineer
### Assigned Student: *[Insert Student Name 1 / Team Member 1]*
**Core Responsibilities & Deliverables:**
1. **Relational Schema Design & 3NF Physical Implementation:**
   - Engineered the 10-table physical schema in `supabase-schema.sql`.
   - Guaranteed full normalization to Third Normal Form (3NF).
   - Enforced referential integrity constraints (`ON DELETE CASCADE`, `ON DELETE RESTRICT`, `ON DELETE SET NULL`).
2. **Cloud Database Hosting & Security:**
   - Provisioned and managed production PostgreSQL 15 on Supabase Cloud (`https://zkarmieyteouuvzhojrv.supabase.co`).
   - Implemented Row Level Security (RLS) policies on all 10 tables to restrict client access.
3. **Data Dictionary Catalog:**
   - Authored `DATABASE_DICTIONARY.md` cataloging data types, entity definitions, and relationship cardinalities.

---

## Member 2: Lead Database Programmer & Query Optimization Engineer
### Assigned Student: *[Insert Student Name 2 / Team Member 2]*
**Core Responsibilities & Deliverables:**
1. **Server-Side Database Programming (Automation over Application):**
   - Developed automated audit triggers (`trg_audit_orders`, `trg_audit_inventory`, `trg_audit_menu`) writing directly to `audit_logs`.
   - Engineered inventory stock depletion trigger (`trg_order_item_deduct_inventory`) auto-decrementing raw ingredients.
   - Authored stored procedures & functions:
     - `sp_place_canteen_order`: Multi-table atomic transaction block.
     - `sp_update_order_status`: State transition validation.
     - `sp_restock_inventory`: Ingredient replenishment.
2. **Query Optimization & Benchmarking:**
   - Implemented B-Tree indexing strategies on foreign keys and compound search fields.
   - Generated query execution plan reports (`EXPLAIN ANALYZE`) in `BENCHMARKS.md`.
   - Created database views `v_stall_sales_analytics` and `v_low_stock_alerts`.

---

## Member 3: Frontend/UI Connector & Git Workflow Administrator
### Assigned Student: *[Insert Student Name 3 / Team Member 3]*
**Core Responsibilities & Deliverables:**
1. **Decoupled Architecture & UI Binding:**
   - Built the decoupled API service communication layer (`src/services/canteenApi.ts`).
   - Connected user interactions to JSON endpoints and stored procedures without embedding raw SQL queries in UI components.
2. **Multi-Tier RBAC Dashboard Layouts:**
   - Developed 3 distinct user tier dashboards (`Student Client`, `Kitchen Staff KDS`, `Lead DBA & Admin Console`).
   - Built the in-app interactive SQL Studio (`src/components/SqlEditor.tsx`).
3. **Git Workflow & Version Control:**
   - Managed Git branch protection and feature branches (`feature/erd-schema-v1`, `feature/stored-procedures-audit`).
   - Enforced commit message standards using conventional prefixes (`feat:`, `fix:`).
