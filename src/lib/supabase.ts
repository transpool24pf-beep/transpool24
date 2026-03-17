import { createClient, SupabaseClient } from "@supabase/supabase-js";

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is required");
  return url;
}

function getAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is required");
  return key;
}

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) _supabase = createClient(getSupabaseUrl(), getAnonKey());
  return _supabase;
}

export function createServerSupabase(): SupabaseClient {
  const url = getSupabaseUrl();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required on server");
  return createClient(url, serviceRoleKey);
}

export type Job = {
  id: string;
  order_number: number | null;
  customer_id: string | null;
  company_name: string;
  pickup_address: string;
  pickup_city: string | null;
  delivery_address: string;
  delivery_city: string | null;
  phone: string;
  customer_email: string | null;
  preferred_pickup_at: string | null;
  cargo_size: "XS" | "M" | "L";
  cargo_details: Record<string, unknown> | null;
  service_type: "driver_only" | "driver_car" | "driver_car_assistant";
  distance_km: number | null;
  duration_minutes: number | null;
  price_cents: number;
  driver_price_cents?: number | null;
  payment_status: "pending" | "paid" | "refunded" | "failed";
  logistics_status: string;
  confirmation_token: string | null;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  assigned_driver_id: string | null;
  created_at: string;
  updated_at: string;
};
