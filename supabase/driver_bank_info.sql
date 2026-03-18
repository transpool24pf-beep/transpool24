-- Bank details for driver payments (IBAN + account holder name)
ALTER TABLE public.driver_applications
  ADD COLUMN IF NOT EXISTS iban text,
  ADD COLUMN IF NOT EXISTS bank_account_holder_name text;

COMMENT ON COLUMN public.driver_applications.iban IS 'IBAN for bank transfer to driver';
COMMENT ON COLUMN public.driver_applications.bank_account_holder_name IS 'Account holder name as on bank card';
