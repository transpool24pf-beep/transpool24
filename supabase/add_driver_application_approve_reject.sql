-- Approve / Reject for driver applications
alter table public.driver_applications
  add column if not exists approved_at timestamptz,
  add column if not exists rejected_at timestamptz,
  add column if not exists rejection_notes text,
  add column if not exists rejection_image_urls jsonb default '[]',
  add column if not exists driver_number integer unique;

-- status: 'new' | 'approved' | 'rejected'
-- driver_number: assigned on approve, shown in admin Drivers list
comment on column public.driver_applications.approved_at is 'Set when admin approves';
comment on column public.driver_applications.rejection_notes is 'Reason for rejection (required when rejecting)';
comment on column public.driver_applications.rejection_image_urls is 'Array of image URLs attached to rejection';
comment on column public.driver_applications.driver_number is 'Unique driver number assigned when approved; shown in Drivers list';
