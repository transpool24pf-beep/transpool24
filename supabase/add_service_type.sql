-- Add service_type to jobs (driver_only | driver_car | driver_car_assistant)
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS service_type TEXT NOT NULL DEFAULT 'driver_car';
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_service_type_check;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_service_type_check
  CHECK (service_type IN ('driver_only', 'driver_car', 'driver_car_assistant'));
