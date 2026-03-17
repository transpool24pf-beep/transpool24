-- Extended fields for driver application (steps 1–4).
-- Optional: In Supabase Dashboard > Storage, create bucket "driver-documents" with public read for uploads.
alter table public.driver_applications
  add column if not exists service_policy_accepted boolean default false,
  add column if not exists id_document_url text,
  add column if not exists license_front_url text,
  add column if not exists license_back_url text,
  add column if not exists tax_or_commercial_number text,
  add column if not exists personal_photo_url text,
  add column if not exists languages_spoken text,
  add column if not exists vehicle_plate text,
  add column if not exists vehicle_documents_url text,
  add column if not exists vehicle_photo_url text,
  add column if not exists work_policy_accepted boolean default false;

-- Make optional for new multi-step flow (old single form had these required)
alter table public.driver_applications alter column license drop not null;
alter table public.driver_applications alter column vehicle_type drop not null;
alter table public.driver_applications alter column availability drop not null;

comment on column public.driver_applications.service_policy_accepted is 'Step 1: service/WhatsApp contact consent';
comment on column public.driver_applications.work_policy_accepted is 'Step 4: company work policy agreement';
