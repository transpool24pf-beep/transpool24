create table if not exists public.driver_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  city text not null,
  license text not null,
  vehicle_type text not null,
  availability text not null,
  experience text,
  note text,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.driver_applications enable row level security;
