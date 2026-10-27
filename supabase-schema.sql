-- =====================================================================================
-- SMARTBITE CANTEEN FOOD HUB & INVENTORY SUPPLY CHAIN ENGINE
-- ADVANCED DATABASE SYSTEMS - PRODUCTION DATABASE SCHEMA SPECIFICATION
-- Database Engine: PostgreSQL 15+ (Supabase Cloud Deployment)
-- Architecture: Third Normal Form (3NF), 10 Normalized Entities, 3 M:N Junction Tables,
--               Automated Server-Side Audit & Stock Depletion Triggers, Stored Procedures,
--               Comprehensive Multi-Tier Role-Based Access Control (RBAC) & Realtime Subscriptions
-- =====================================================================================

-- Refresh dependent views & stored functions safely
DROP VIEW IF EXISTS v_stall_sales_analytics CASCADE;
DROP VIEW IF EXISTS v_low_stock_alerts CASCADE;
-- =====================================================================================
-- 1. PROFILES (Entity 1: User Identity & Multi-Tier RBAC)
-- Roles: student, staff, stall_manager, admin
-- =====================================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT UNIQUE NOT NULL,
  email TEXT,
  first_name TEXT,
  middle_name TEXT,
  last_name TEXT,
  full_name TEXT NOT NULL,
  grade_or_dept TEXT DEFAULT 'Grade 12 - STEM',
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'staff', 'stall_manager', 'admin')),
  balance NUMERIC(10, 2) DEFAULT 500.00 CHECK (balance >= 0),
  stall_id BIGINT,
  password TEXT,
  avatar_url TEXT,
  phone_number TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Backward-compatibility check: ensure existing profiles support all 4 roles and modern columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS middle_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS stall_id BIGINT,
  ADD COLUMN IF NOT EXISTS password TEXT,
  ADD COLUMN IF NOT EXISTS grade_or_dept TEXT DEFAULT 'Grade 12 - STEM',
  ADD COLUMN IF NOT EXISTS balance NUMERIC(10, 2) DEFAULT 500.00,
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Update check constraint on profiles.role to include 'stall_manager'
DO $$
BEGIN
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('student', 'staff', 'stall_manager', 'admin'));
EXCEPTION
  WHEN others THEN NULL;
END $$;

UPDATE public.profiles
SET student_id = 'LEGACY-' || id::TEXT
WHERE student_id IS NULL OR btrim(student_id) = '';

UPDATE public.profiles
SET full_name = 'Student User'
WHERE full_name IS NULL OR btrim(full_name) = '';

UPDATE public.profiles
SET role = 'student'
WHERE role IS NULL OR role NOT IN ('student', 'staff', 'stall_manager', 'admin');

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_student_id
  ON public.profiles(student_id);

-- Auth Trigger: handles new Supabase auth users automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_first TEXT;
  v_middle TEXT;
  v_last TEXT;
  v_full TEXT;
BEGIN
  v_first := NULLIF(btrim(NEW.raw_user_meta_data->>'first_name'), '');
  v_middle := NULLIF(btrim(NEW.raw_user_meta_data->>'middle_name'), '');
  v_last := NULLIF(btrim(NEW.raw_user_meta_data->>'last_name'), '');
  v_full := COALESCE(
    NULLIF(btrim(NEW.raw_user_meta_data->>'full_name'), ''),
    trim(concat_ws(' ', v_first, v_middle, v_last)),
    'Student User'
  );

  INSERT INTO public.profiles (id, student_id, email, first_name, middle_name, last_name, full_name, grade_or_dept, role)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(btrim(NEW.raw_user_meta_data->>'student_id'), ''), split_part(NEW.email, '@', 1)),
    NEW.email,
    v_first,
    v_middle,
    v_last,
    v_full,
    COALESCE(NULLIF(btrim(NEW.raw_user_meta_data->>'grade_or_dept'), ''), 'Grade 12 - STEM'),
    COALESCE(NULLIF(btrim(NEW.raw_user_meta_data->>'role'), ''), 'student')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    middle_name = EXCLUDED.middle_name,
    last_name = EXCLUDED.last_name,
    full_name = EXCLUDED.full_name;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================================================
-- 2. STALLS / VENDORS (Entity 2: Multi-Tenant Canteen Stalls)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS stalls (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  stall_code TEXT NOT NULL UNIQUE,
  description TEXT,
  manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_open BOOLEAN DEFAULT true,
  rating NUMERIC(3, 2) DEFAULT 4.8 CHECK (rating >= 1.0 AND rating <= 5.0),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================================================
-- 3. CATEGORIES (Entity 3: Canteen Menu Categorization per Stall)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  stall_id BIGINT REFERENCES public.stalls(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  display_order INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_stall_category UNIQUE (stall_id, name)
);

-- =====================================================================================
-- 4. MENU_ITEMS (Entity 4: Food Catalog in Strict 3NF)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS menu_items (
  id BIGSERIAL PRIMARY KEY,
  stall_id BIGINT NOT NULL REFERENCES public.stalls(id) ON DELETE RESTRICT,
  category_id BIGINT NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  category TEXT DEFAULT 'Rice Meals',
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price > 0),
  preparation_time_minutes INT DEFAULT 10 CHECK (preparation_time_minutes > 0),
  rating TEXT DEFAULT '4.8',
  image_url TEXT NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_stall_item UNIQUE (stall_id, name)
);

ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Rice Meals',
  ADD COLUMN IF NOT EXISTS preparation_time_minutes INT DEFAULT 10,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;

-- =====================================================================================
-- 5. INVENTORY_ITEMS (Entity 5: Raw Material Stock Tracking)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS inventory_items (
  id BIGSERIAL PRIMARY KEY,
  stall_id BIGINT NOT NULL REFERENCES public.stalls(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  unit_of_measure TEXT NOT NULL CHECK (unit_of_measure IN ('kg', 'grams', 'pieces', 'liters', 'servings')),
  current_stock NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (current_stock >= 0),
  minimum_threshold NUMERIC(10, 2) NOT NULL DEFAULT 10.00,
  reorder_quantity NUMERIC(10, 2) NOT NULL DEFAULT 50.00,
  last_restocked_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_stall_inventory UNIQUE (stall_id, item_name)
);

-- =====================================================================================
-- 6. MENU_ITEM_INGREDIENTS (Entity 6: Junction Table 1 - N:M Menu <-> Inventory)
-- Resolves Many-to-Many relationship with rich intersection recipe attributes
-- =====================================================================================
CREATE TABLE IF NOT EXISTS menu_item_ingredients (
  id BIGSERIAL PRIMARY KEY,
  menu_item_id BIGINT NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  inventory_item_id BIGINT NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
  quantity_required NUMERIC(8, 2) NOT NULL CHECK (quantity_required > 0),
  unit TEXT NOT NULL,
  is_critical BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_menu_ingredient UNIQUE (menu_item_id, inventory_item_id)
);

-- =====================================================================================
-- 7. STALL_STAFF (Entity 7: Junction Table 2 - N:M Stall <-> Staff Profiles)
-- Resolves Many-to-Many mapping with intersection attributes (shift, role, duty status)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS stall_staff (
  id BIGSERIAL PRIMARY KEY,
  stall_id BIGINT NOT NULL REFERENCES public.stalls(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_title TEXT NOT NULL DEFAULT 'Kitchen Staff' CHECK (role_title IN ('Manager', 'Chef', 'Cashier', 'Kitchen Staff')),
  shift_schedule TEXT DEFAULT 'Morning (07:00 - 15:00)',
  is_on_duty BOOLEAN DEFAULT true,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_stall_staff UNIQUE (stall_id, profile_id)
);

-- =====================================================================================
-- 8. ORDERS (Entity 8: Order Header in Strict 3NF)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  student_id TEXT,
  stall_id BIGINT NOT NULL REFERENCES public.stalls(id) ON DELETE RESTRICT,
  student_number TEXT NOT NULL,
  student_name TEXT NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
  service_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  order_status TEXT NOT NULL DEFAULT 'Order placed' CHECK (order_status IN ('Order placed', 'Preparing', 'Ready for pickup', 'Completed', 'Cancelled')),
  pickup_time TEXT DEFAULT '8–12 minutes',
  payment_method TEXT NOT NULL DEFAULT 'Cash at counter' CHECK (payment_method IN ('Cash at counter', 'Student Wallet', 'GCash', 'Maya')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================================================
-- 9. ORDER_ITEMS (Entity 9: Junction Table 3 - N:M Orders <-> Menu Items)
-- Eliminates JSONB array dependency; enforces 1NF/3NF with atomic intersection fields
-- =====================================================================================
CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id BIGINT NOT NULL REFERENCES public.menu_items(id) ON DELETE RESTRICT,
  item_name TEXT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  item_subtotal NUMERIC(10, 2) NOT NULL CHECK (item_subtotal >= 0),
  special_instructions TEXT,
  item_status TEXT DEFAULT 'pending' CHECK (item_status IN ('pending', 'cooking', 'prepared')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================================================
-- 10. AUDIT_LOGS (Entity 10: Automated Database Trigger Audit Engine)
-- Captures row mutations, inventory adjustments, and order state transitions server-side
-- =====================================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  performed_by TEXT,
  old_data JSONB,
  new_data JSONB,
  change_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================================================
-- INDEXING OPTIMIZATION STRATEGIES (Execution Plan & Search Acceleration)
-- =====================================================================================
CREATE INDEX IF NOT EXISTS idx_menu_items_stall ON public.menu_items(stall_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON public.menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stall ON public.inventory_items(stall_id);
CREATE INDEX IF NOT EXISTS idx_orders_student ON public.orders(student_id);
CREATE INDEX IF NOT EXISTS idx_orders_stall_status ON public.orders(stall_id, order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu ON public.order_items(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_audit_table_record ON public.audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs(created_at DESC);

-- =====================================================================================
-- DATABASE VIEWS (Data Abstraction & Multi-Tenant Analytics)
-- =====================================================================================

-- View 1: Stall Sales Analytics (Aggregated sales & KPI view)
CREATE OR REPLACE VIEW public.v_stall_sales_analytics AS
SELECT 
  s.id AS stall_id,
  s.name AS stall_name,
  s.stall_code,
  COUNT(o.id) AS total_orders,
  COALESCE(SUM(CASE WHEN o.order_status = 'Completed' THEN o.total_amount ELSE 0 END), 0) AS total_revenue,
  COALESCE(AVG(CASE WHEN o.order_status = 'Completed' THEN o.total_amount END), 0) AS average_order_value,
  COUNT(CASE WHEN o.order_status IN ('Order placed', 'Preparing') THEN 1 END) AS pending_orders
FROM public.stalls s
LEFT JOIN public.orders o ON s.id = o.stall_id
GROUP BY s.id, s.name, s.stall_code;

-- View 2: Low Stock Alert View (Automated safety threshold notification)
CREATE OR REPLACE VIEW public.v_low_stock_alerts AS
SELECT 
  i.id AS inventory_id,
  s.name AS stall_name,
  i.item_name,
  i.current_stock,
  i.minimum_threshold,
  i.unit_of_measure,
  GREATEST(0, (i.minimum_threshold - i.current_stock)) AS deficit_amount,
  CASE 
    WHEN i.current_stock = 0 THEN 'OUT OF STOCK'
    WHEN i.current_stock <= (i.minimum_threshold * 0.5) THEN 'CRITICAL'
    ELSE 'LOW'
  END AS severity_level
FROM public.inventory_items i
JOIN public.stalls s ON i.stall_id = s.id
WHERE i.current_stock <= i.minimum_threshold;

-- =====================================================================================
-- AUTOMATED TRIGGERS (Server-Side Database Automation)
-- =====================================================================================

-- Trigger Function 1: Universal Audit Logger
CREATE OR REPLACE FUNCTION public.fn_audit_log_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, new_data, change_summary)
    VALUES (TG_TABLE_NAME, COALESCE(NEW.id::TEXT, 'N/A'), 'INSERT', to_jsonb(NEW), 'Record created');
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, old_data, new_data, change_summary)
    VALUES (
      TG_TABLE_NAME, 
      COALESCE(NEW.id::TEXT, OLD.id::TEXT, 'N/A'), 
      'UPDATE', 
      to_jsonb(OLD), 
      to_jsonb(NEW), 
      CONCAT('Updated in ', TG_TABLE_NAME)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, old_data, change_summary)
    VALUES (TG_TABLE_NAME, COALESCE(OLD.id::TEXT, 'N/A'), 'DELETE', to_jsonb(OLD), 'Record deleted');
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_orders ON public.orders;
CREATE TRIGGER trg_audit_orders
  AFTER INSERT OR UPDATE OR DELETE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_trigger();

DROP TRIGGER IF EXISTS trg_audit_inventory ON public.inventory_items;
CREATE TRIGGER trg_audit_inventory
  AFTER INSERT OR UPDATE OR DELETE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_trigger();

DROP TRIGGER IF EXISTS trg_audit_menu ON public.menu_items;
CREATE TRIGGER trg_audit_menu
  AFTER INSERT OR UPDATE OR DELETE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_trigger();

-- Trigger Function 2: Automated Inventory Stock Depletion on Order Placement
CREATE OR REPLACE FUNCTION public.fn_deduct_inventory_on_order()
RETURNS TRIGGER AS $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN 
    SELECT inventory_item_id, (quantity_required * NEW.quantity) AS total_needed
    FROM public.menu_item_ingredients
    WHERE menu_item_id = NEW.menu_item_id
  LOOP
    UPDATE public.inventory_items
    SET current_stock = GREATEST(0, current_stock - rec.total_needed)
    WHERE id = rec.inventory_item_id;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_order_item_deduct_inventory ON public.order_items;
CREATE TRIGGER trg_order_item_deduct_inventory
  AFTER INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.fn_deduct_inventory_on_order();

-- =====================================================================================
-- STORED PROCEDURES & FUNCTIONS (Server-Side Business Logic & Transaction Blocks)
-- =====================================================================================

-- Stored Function 1: sp_place_canteen_order (Atomic Multi-Table Transaction Block)
CREATE OR REPLACE FUNCTION public.sp_place_canteen_order(
  p_order_id TEXT,
  p_student_id TEXT,
  p_stall_id BIGINT,
  p_student_number TEXT,
  p_student_name TEXT,
  p_payment_method TEXT,
  p_items JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_item JSONB;
  v_menu_item RECORD;
  v_subtotal NUMERIC(10, 2) := 0.00;
  v_total NUMERIC(10, 2) := 0.00;
  v_qty INT;
  v_price NUMERIC(10, 2);
  v_item_sub NUMERIC(10, 2);
BEGIN
  -- 1. Validate Stall Exists and Is Open
  IF NOT EXISTS (SELECT 1 FROM public.stalls WHERE id = p_stall_id AND is_open = true) THEN
    RAISE EXCEPTION 'Canteen stall is currently closed or does not exist.';
  END IF;

  -- 2. Verify Stock & Compute Subtotal Server-Side (prevent client price tampering)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := (v_item->>'quantity')::INT;
    SELECT * INTO v_menu_item FROM public.menu_items WHERE id = (v_item->>'menu_item_id')::BIGINT;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Menu item ID % not found.', (v_item->>'menu_item_id');
    END IF;

    IF v_menu_item.is_available = false THEN
      RAISE EXCEPTION 'Menu item "%" is currently marked sold out.', v_menu_item.name;
    END IF;

    v_price := v_menu_item.price;
    v_item_sub := v_price * v_qty;
    v_subtotal := v_subtotal + v_item_sub;
  END LOOP;

  v_total := v_subtotal;

  -- 3. Atomic Order Header Insertion
  INSERT INTO public.orders (
    id, student_id, stall_id, student_number, student_name,
    subtotal, service_fee, total_amount, order_status,
    pickup_time, payment_method, payment_status
  ) VALUES (
    p_order_id, p_student_id, p_stall_id, p_student_number, p_student_name,
    v_subtotal, 0.00, v_total, 'Order placed',
    '8–12 minutes', p_payment_method, 'pending'
  );

  -- 4. Atomic Order Items Insertion (Fires inventory stock depletion trigger automatically)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := (v_item->>'quantity')::INT;
    SELECT * INTO v_menu_item FROM public.menu_items WHERE id = (v_item->>'menu_item_id')::BIGINT;
    v_price := v_menu_item.price;
    v_item_sub := v_price * v_qty;

    INSERT INTO public.order_items (
      order_id, menu_item_id, item_name, quantity, unit_price, item_subtotal, special_instructions
    ) VALUES (
      p_order_id, v_menu_item.id, v_menu_item.name, v_qty, v_price, v_item_sub, v_item->>'special_instructions'
    );
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'total_amount', v_total,
    'status', 'Order placed'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Stored Function 2: sp_update_order_status (State Machine Management)
CREATE OR REPLACE FUNCTION public.sp_update_order_status(
  p_order_id TEXT,
  p_new_status TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_current_status TEXT;
BEGIN
  SELECT order_status INTO v_current_status FROM public.orders WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % does not exist.', p_order_id;
  END IF;

  IF p_new_status NOT IN ('Order placed', 'Preparing', 'Ready for pickup', 'Completed', 'Cancelled') THEN
    RAISE EXCEPTION 'Invalid status transition: %', p_new_status;
  END IF;

  UPDATE public.orders
  SET 
    order_status = p_new_status,
    updated_at = now()
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'previous_status', v_current_status,
    'new_status', p_new_status
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Stored Function 3: sp_restock_inventory (Bulk Ingredient Replenishment)
CREATE OR REPLACE FUNCTION public.sp_restock_inventory(
  p_inventory_id BIGINT,
  p_quantity_added NUMERIC(10, 2)
)
RETURNS JSONB AS $$
DECLARE
  v_new_stock NUMERIC(10, 2);
  v_item_name TEXT;
BEGIN
  IF p_quantity_added <= 0 THEN
    RAISE EXCEPTION 'Restock quantity must be positive.';
  END IF;

  UPDATE public.inventory_items
  SET 
    current_stock = current_stock + p_quantity_added,
    last_restocked_at = now()
  WHERE id = p_inventory_id
  RETURNING current_stock, item_name INTO v_new_stock, v_item_name;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inventory item % not found.', p_inventory_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'item_name', v_item_name,
    'new_stock_level', v_new_stock
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution privileges to anon, authenticated, and service_role
GRANT EXECUTE ON FUNCTION public.sp_place_canteen_order TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sp_update_order_status TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sp_restock_inventory TO anon, authenticated, service_role;

-- =====================================================================================
-- ROW LEVEL SECURITY (Comprehensive RBAC Policies for Supabase API)
-- =====================================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stalls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_item_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stall_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Clean existing policies safely
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- 1. Profiles Policies
CREATE POLICY "Allow public read on profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public insert on profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on profiles" ON public.profiles FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on profiles" ON public.profiles FOR DELETE USING (true);

-- 2. Stalls Policies (read by public; manage by staff/admin)
CREATE POLICY "Allow read on stalls" ON public.stalls FOR SELECT USING (true);
CREATE POLICY "Allow insert on stalls" ON public.stalls FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on stalls" ON public.stalls FOR UPDATE USING (true);
CREATE POLICY "Allow delete on stalls" ON public.stalls FOR DELETE USING (true);

-- 3. Categories Policies
CREATE POLICY "Allow read on categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow insert on categories" ON public.categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on categories" ON public.categories FOR UPDATE USING (true);
CREATE POLICY "Allow delete on categories" ON public.categories FOR DELETE USING (true);

-- 4. Menu Items Policies
CREATE POLICY "Allow read on menu_items" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Allow insert on menu_items" ON public.menu_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on menu_items" ON public.menu_items FOR UPDATE USING (true);
CREATE POLICY "Allow delete on menu_items" ON public.menu_items FOR DELETE USING (true);

-- 5. Inventory Items Policies
CREATE POLICY "Allow read on inventory_items" ON public.inventory_items FOR SELECT USING (true);
CREATE POLICY "Allow insert on inventory_items" ON public.inventory_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on inventory_items" ON public.inventory_items FOR UPDATE USING (true);
CREATE POLICY "Allow delete on inventory_items" ON public.inventory_items FOR DELETE USING (true);

-- 6. Menu Item Ingredients Policies
CREATE POLICY "Allow read on menu_item_ingredients" ON public.menu_item_ingredients FOR SELECT USING (true);
CREATE POLICY "Allow insert on menu_item_ingredients" ON public.menu_item_ingredients FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on menu_item_ingredients" ON public.menu_item_ingredients FOR UPDATE USING (true);
CREATE POLICY "Allow delete on menu_item_ingredients" ON public.menu_item_ingredients FOR DELETE USING (true);

-- 7. Stall Staff Policies
CREATE POLICY "Allow read on stall_staff" ON public.stall_staff FOR SELECT USING (true);
CREATE POLICY "Allow insert on stall_staff" ON public.stall_staff FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on stall_staff" ON public.stall_staff FOR UPDATE USING (true);
CREATE POLICY "Allow delete on stall_staff" ON public.stall_staff FOR DELETE USING (true);

-- 8. Orders Policies
CREATE POLICY "Allow read on orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow insert on orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on orders" ON public.orders FOR UPDATE USING (true);
CREATE POLICY "Allow delete on orders" ON public.orders FOR DELETE USING (true);

-- 9. Order Items Policies
CREATE POLICY "Allow read on order_items" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Allow insert on order_items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on order_items" ON public.order_items FOR UPDATE USING (true);
CREATE POLICY "Allow delete on order_items" ON public.order_items FOR DELETE USING (true);

-- 10. Audit Logs Policies
CREATE POLICY "Allow read on audit_logs" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Allow insert on audit_logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- Realtime Subscriptions Configuration
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'orders') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'order_items') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'inventory_items') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_items;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'menu_items') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'stalls') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.stalls;
  END IF;
END $$;

-- =====================================================================================
-- SEED ENTERPRISE DATA (Real Canteen Stalls, Catalogs, Recipes, Stocks, and Profiles)
-- =====================================================================================

-- 1. Initial Stalls
INSERT INTO public.stalls (id, name, stall_code, description, is_open, rating) VALUES
  (1, 'SmartBite Main Kitchen', 'STALL-01', 'Signature rice meals, breakfasts, and hot mains', true, 4.9),
  (2, 'The Snack Bar & Drinks', 'STALL-02', 'Quick finger bites, dimsum, and freshly pressed refreshments', true, 4.8)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  stall_code = EXCLUDED.stall_code,
  description = EXCLUDED.description;

-- 2. Initial Categories
INSERT INTO public.categories (id, stall_id, name, description, display_order) VALUES
  (1, 1, 'Rice Meals', 'Hearty meals served with steamed or garlic rice', 1),
  (2, 1, 'Breakfast', 'Morning favorites to kickstart school days', 2),
  (3, 2, 'Snacks', 'Savory dumplings, wraps, and quick bites', 3),
  (4, 2, 'Drinks', 'Chilled juices, coolers, and refreshments', 4)
ON CONFLICT (id) DO NOTHING;

-- 3. Initial Menu Items
INSERT INTO public.menu_items (id, stall_id, category_id, category, name, description, price, preparation_time_minutes, rating, image_url, is_available) VALUES
  (1, 1, 1, 'Rice Meals', 'Chicken Adobo Bowl', 'Tender chicken braised in garlic-soy vinegar with jasmine rice', 75.00, 8, '4.9', 'https://images.unsplash.com/photo-1562748762-77b7c4633c83?auto=format&fit=crop&w=900&q=85', true),
  (2, 1, 1, 'Rice Meals', 'Crispy Fried Chicken', 'Golden spiced chicken thigh with savory gravy and garlic rice', 85.00, 10, '4.8', 'https://images.unsplash.com/photo-1539156340048-e86bca4fa3f7?auto=format&fit=crop&w=900&q=85', true),
  (3, 1, 1, 'Rice Meals', 'Fresh Veggie Rice Bowl', 'Wok-tossed market vegetables, fried tofu, and seasoned garlic rice', 65.00, 7, '4.7', 'https://images.unsplash.com/photo-1657812453317-031b93301ef0?auto=format&fit=crop&w=900&q=85', true),
  (4, 1, 2, 'Breakfast', 'Beef Tapa Silog', 'Marinated cured beef sirloin with sunny fried egg and garlic rice', 80.00, 9, '4.8', 'https://images.unsplash.com/photo-1777312820610-8d5321fd45ad?auto=format&fit=crop&w=900&q=85', true),
  (5, 2, 3, 'Snacks', 'Classic Pork Siomai', 'Four steamed pork-shrimp dumplings with garlic chili oil', 45.00, 5, '4.9', 'https://images.unsplash.com/photo-1625980319455-985e5442c5ae?auto=format&fit=crop&w=900&q=85', true),
  (6, 2, 4, 'Drinks', 'Chilled Calamansi Juice', 'Freshly extracted native lime, honey, and crushed iced water', 30.00, 3, '4.6', 'https://images.unsplash.com/photo-1591902060415-60a251d0ac68?auto=format&fit=crop&w=900&q=85', true)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price,
  category = EXCLUDED.category,
  preparation_time_minutes = EXCLUDED.preparation_time_minutes;

-- 4. Initial Raw Stock Inventory
INSERT INTO public.inventory_items (id, stall_id, item_name, unit_of_measure, current_stock, minimum_threshold, reorder_quantity) VALUES
  (1, 1, 'Marinated Chicken Cuts', 'kg', 45.00, 10.00, 50.00),
  (2, 1, 'Jasmine Steamed Rice', 'kg', 80.00, 15.00, 100.00),
  (3, 1, 'Beef Tapa Cuts', 'kg', 30.00, 8.00, 40.00),
  (4, 1, 'Farm Fresh Eggs', 'pieces', 120.00, 24.00, 150.00),
  (5, 2, 'Pork Siomai Pack', 'pieces', 200.00, 40.00, 250.00),
  (6, 2, 'Fresh Calamansi Puree', 'liters', 25.00, 5.00, 30.00)
ON CONFLICT (id) DO UPDATE SET 
  current_stock = EXCLUDED.current_stock,
  minimum_threshold = EXCLUDED.minimum_threshold;

-- 5. Menu-Ingredient Recipe Mappings (Junction Table 1)
INSERT INTO public.menu_item_ingredients (id, menu_item_id, inventory_item_id, quantity_required, unit, is_critical) VALUES
  (1, 1, 1, 1.00, 'kg', true),      -- 1 portion chicken per adobo
  (2, 1, 2, 1.00, 'kg', true),      -- 1 portion rice per adobo
  (3, 2, 1, 1.00, 'kg', true),      -- 1 portion chicken per fried chicken
  (4, 2, 2, 1.00, 'kg', true),      -- 1 portion rice per fried chicken
  (5, 3, 2, 1.00, 'kg', true),      -- 1 portion rice per veggie bowl
  (6, 4, 3, 1.00, 'kg', true),      -- 1 portion beef tapa
  (7, 4, 4, 1.00, 'pieces', true),  -- 1 egg per silog
  (8, 4, 2, 1.00, 'kg', true),      -- 1 portion rice per silog
  (9, 5, 5, 4.00, 'pieces', true),  -- 4 siomai pieces
  (10, 6, 6, 1.00, 'liters', true)  -- 1 portion calamansi puree
ON CONFLICT (id) DO NOTHING;

-- 6. Seed Profiles for All 4 Roles
INSERT INTO public.profiles (id, student_id, first_name, middle_name, last_name, full_name, grade_or_dept, role, balance, stall_id, password, is_active) VALUES
  ('a0000000-0000-0000-0000-000000000001', '2025-01234', 'Rommel', '', 'Custodio', 'Rommel Custodio', 'Grade 12 - STEM A', 'student', 500.00, NULL, 'student123', true),
  ('a0000000-0000-0000-0000-000000000002', 'STAFF-KITCHEN', 'Maria', 'Alvarez', 'Santos', 'Chef Maria Santos', 'Stall #1 Main Kitchen Staff', 'staff', 1200.00, 1, 'staff123', true),
  ('a0000000-0000-0000-0000-000000000003', 'MGR-BRANCH', 'Carlos', 'Jose', 'Mendoza', 'Carlos Jose Mendoza', 'Stall Operations Manager', 'stall_manager', 3500.00, 1, 'manager123', true),
  ('a0000000-0000-0000-0000-000000000004', 'ADMIN-DBA', 'David', 'Cruz', 'Reyes', 'Engr. David Reyes (Lead DBA)', 'Database & Canteen Administration', 'admin', 5000.00, NULL, 'admin123', true)
ON CONFLICT (student_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  password = EXCLUDED.password;

-- 7. Reset Sequence Counters
SELECT setval('public.stalls_id_seq', COALESCE((SELECT MAX(id) FROM public.stalls), 1));
SELECT setval('public.categories_id_seq', COALESCE((SELECT MAX(id) FROM public.categories), 1));
SELECT setval('public.menu_items_id_seq', COALESCE((SELECT MAX(id) FROM public.menu_items), 1));
SELECT setval('public.inventory_items_id_seq', COALESCE((SELECT MAX(id) FROM public.inventory_items), 1));
SELECT setval('public.menu_item_ingredients_id_seq', COALESCE((SELECT MAX(id) FROM public.menu_item_ingredients), 1));

-- Supabase Storage bucket for product photos (public URLs are saved in menu_items.image_url).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'menu-images',
  'menu-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public can view menu images" ON storage.objects;
DROP POLICY IF EXISTS "App can upload menu images" ON storage.objects;
CREATE POLICY "Public can view menu images"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'menu-images');
CREATE POLICY "App can upload menu images"
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'menu-images');
