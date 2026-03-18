-- تعليق العميل على تقييم السائق (مع النجوم)
alter table public.jobs
  add column if not exists customer_driver_comment text;

comment on column public.jobs.customer_driver_comment is 'Optional comment from customer when rating the driver (rate-driver page)';
