-- ================================================================
-- SmartBite Canteen Ordering System - Supabase Database Schema
-- ================================================================
-- Run this in the Supabase Dashboard -> SQL Editor -> New Query -> Run

-- 1. PROFILES TABLE (Linked with Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id TEXT UNIQUE,
  full_name TEXT,
  grade_level TEXT DEFAULT 'Student · Grade 12',
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'staff', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read of profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Allow users to update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Allow users to insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Trigger to create profile automatically on auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, student_id, full_name, grade_level, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'student_id', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Student User'),
    COALESCE(NEW.raw_user_meta_data->>'grade_level', 'Student · Grade 12'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on categories"
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated staff to manage categories"
  ON public.categories FOR ALL
  TO authenticated
  USING (true);

INSERT INTO public.categories (name, description) VALUES
  ('Rice Meals', 'Hearty meals served with steamed or garlic rice'),
  ('Snacks', 'Quick bites and savory snacks'),
  ('Drinks', 'Refreshing cold and hot beverages'),
  ('Breakfast', 'Morning favorites to start your day')
ON CONFLICT (name) DO NOTHING;


-- 3. MENU ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.menu_items (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  category TEXT NOT NULL,
  rating TEXT DEFAULT '4.8',
  image TEXT NOT NULL,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on menu_items"
  ON public.menu_items FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated staff to manage menu_items"
  ON public.menu_items FOR ALL
  TO authenticated
  USING (true);

-- Seed Initial SmartBite Menu Items
INSERT INTO public.menu_items (name, description, price, category, rating, image, available) VALUES
  ('Chicken Adobo', 'Tender chicken, soy-vinegar glaze & steamed rice', 75.00, 'Rice Meals', '4.9', 'https://images.unsplash.com/photo-1562748762-77b7c4633c83?auto=format&fit=crop&w=900&q=85', true),
  ('Crispy Chicken', 'Golden fried chicken with gravy & steamed rice', 85.00, 'Rice Meals', '4.8', 'https://images.unsplash.com/photo-1539156340048-e86bca4fa3f7?auto=format&fit=crop&w=900&q=85', true),
  ('Veggie Rice Bowl', 'Fresh seasonal vegetables, egg & garlic rice', 65.00, 'Rice Meals', '4.7', 'https://images.unsplash.com/photo-1657812453317-031b93301ef0?auto=format&fit=crop&w=900&q=85', true),
  ('Classic Siomai', 'Four pork dumplings with chili-garlic sauce', 45.00, 'Snacks', '4.9', 'https://images.unsplash.com/photo-1625980319455-985e5442c5ae?auto=format&fit=crop&w=900&q=85', true),
  ('Silog Breakfast', 'Savory beef, fried egg & warm garlic rice', 80.00, 'Breakfast', '4.8', 'https://images.unsplash.com/photo-1777312820610-8d5321fd45ad?auto=format&fit=crop&w=900&q=85', true),
  ('Iced Calamansi', 'Freshly squeezed, lightly sweetened & chilled', 30.00, 'Drinks', '4.6', 'https://images.unsplash.com/photo-1591902060415-60a251d0ac68?auto=format&fit=crop&w=900&q=85', true)
ON CONFLICT DO NOTHING;


-- 4. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  student_id TEXT,
  student_name TEXT,
  items JSONB NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL,
  service_fee NUMERIC(10, 2) DEFAULT 0.00,
  total NUMERIC(10, 2) NOT NULL,
  status TEXT DEFAULT 'Order placed' CHECK (status IN ('Order placed', 'Preparing', 'Ready for pickup', 'Completed', 'Cancelled')),
  pickup_time TEXT DEFAULT '8–12 minutes',
  payment_method TEXT DEFAULT 'Cash at counter',
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public to insert orders"
  ON public.orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow users to view own or anonymous orders"
  ON public.orders FOR SELECT
  USING (true);

CREATE POLICY "Allow users to update orders"
  ON public.orders FOR UPDATE
  USING (true);

-- 5. ENABLE REALTIME
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'menu_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;
  END IF;
END $$;
