-- تشغيل هذا الملف مرة واحدة في Supabase SQL Editor
-- ينشئ جدول طلبات السائقين ويضيف كل الأعمدة المطلوبة

-- 1) إنشاء الجدول إن لم يكن موجوداً
create table if not exists public.driver_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  city text not null,
  license text,
  vehicle_type text,
  availability text,
  experience text,
  note text,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.driver_applications enable row level security;

-- 2) أعمدة النموذج المتقدم (المستندات والصور)
alter table public.driver_applications
  add column if not exists service_policy_accepted boolean default false,
  add column if not exists id_document_url text,
  add column if not exists id_document_front_url text,
  add column if not exists id_document_back_url text,
  add column if not exists license_front_url text,
  add column if not exists license_back_url text,
  add column if not exists tax_or_commercial_number text,
  add column if not exists personal_photo_url text,
  add column if not exists languages_spoken text,
  add column if not exists vehicle_plate text,
  add column if not exists vehicle_documents_url text,
  add column if not exists vehicle_photo_url text,
  add column if not exists work_policy_accepted boolean default false;

-- 3) أعمدة الموافقة والرفض ورقم السائق
alter table public.driver_applications
  add column if not exists approved_at timestamptz,
  add column if not exists rejected_at timestamptz,
  add column if not exists rejection_notes text,
  add column if not exists rejection_image_urls jsonb default '[]',
  add column if not exists driver_number integer unique;

-- جعل الأعمدة القديمة اختيارية (إن كانت still not null)
alter table public.driver_applications alter column license drop not null;
alter table public.driver_applications alter column vehicle_type drop not null;
alter table public.driver_applications alter column availability drop not null;
