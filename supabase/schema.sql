-- TransPool24 Supabase Schema
-- Run this in Supabase Dashboard → SQL Editor → New query → paste & Run
-- Required for checkout (jobs table). Without it you get PGRST205 / "Failed to create order".

-- Enable UUID extension if not already
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles: extended user data (linked to auth.users via id)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  company_name TEXT,
  phone TEXT,
  role TEXT CHECK (role IN ('customer', 'driver', 'admin')) DEFAULT 'customer',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs: transport orders
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  pickup_address TEXT NOT NULL,
  pickup_city TEXT DEFAULT 'Pforzheim',
  delivery_address TEXT NOT NULL,
  delivery_city TEXT,
  phone TEXT NOT NULL,
  customer_email TEXT,
  cargo_size TEXT NOT NULL CHECK (cargo_size IN ('XS', 'M', 'L', 'XL')),
  distance_km NUMERIC(10, 2),
  price_cents INTEGER NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
  logistics_status TEXT NOT NULL DEFAULT 'draft' CHECK (logistics_status IN ('draft', 'confirmed', 'paid', 'assigned', 'in_transit', 'delivered', 'cancelled')),
  confirmation_token TEXT UNIQUE,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Driver documents: references to files in Storage (Gewerbe, insurance, ID)
CREATE TABLE IF NOT EXISTS public.driver_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('gewerbe', 'insurance', 'id')),
  storage_path TEXT NOT NULL,
  file_name TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_documents ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Jobs: customers see own jobs; service role can do everything (for webhook)
CREATE POLICY "Users can view own jobs" ON public.jobs FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Users can insert jobs" ON public.jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role full access" ON public.jobs FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Driver documents: drivers see own
CREATE POLICY "Drivers can view own documents" ON public.driver_documents FOR SELECT USING (auth.uid() = driver_id);
CREATE POLICY "Drivers can insert own documents" ON public.driver_documents FOR INSERT WITH CHECK (auth.uid() = driver_id);

-- Storage bucket for driver documents (create in Supabase Dashboard or via API)
-- Bucket name: driver-documents (private, RLS by driver_id in path)

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER driver_documents_updated_at BEFORE UPDATE ON public.driver_documents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Optional: trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
