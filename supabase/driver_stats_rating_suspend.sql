-- تقييم السائق من العميل + تقييد العمل + ملاحظة "كم يريد من الشركة"
-- تشغيل مرة واحدة في Supabase SQL Editor

-- 1) الطلبات: تقييم العميل للسائق + توكن رابط التقييم + ربط سائق من طلبات التقديم
alter table public.jobs
  add column if not exists customer_driver_rating integer check (customer_driver_rating >= 1 and customer_driver_rating <= 5),
  add column if not exists rating_token text unique,
  add column if not exists assigned_driver_application_id uuid references public.driver_applications(id) on delete set null;

-- 2) طلبات السائقين: تقييد العمل + ما يريده من الشركة
alter table public.driver_applications
  add column if not exists suspended_at timestamptz,
  add column if not exists desired_note text,
  add column if not exists star_rating numeric(2,1);

-- 3) الملفات (profiles): تقييد العمل
alter table public.profiles
  add column if not exists suspended_at timestamptz;

comment on column public.jobs.customer_driver_rating is '1-5 stars from customer (rate-driver link in email)';
comment on column public.jobs.rating_token is 'Token for customer rating link';
comment on column public.driver_applications.suspended_at is 'When set, driver work is suspended until further notice';
comment on column public.driver_applications.desired_note is 'What the driver wants from the company (salary, etc.)';
comment on column public.driver_applications.star_rating is 'Display rating (from customer ratings or admin)';
