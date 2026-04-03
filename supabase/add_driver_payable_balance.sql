-- Open balance owed to driver (company → driver). Decrease when recording a payment.
ALTER TABLE public.driver_applications
  ADD COLUMN IF NOT EXISTS payable_balance_cents INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.driver_applications.payable_balance_cents IS 'Amount still owed to driver (cents); admin subtracts on payment';

ALTER TABLE public.driver_applications
  DROP CONSTRAINT IF EXISTS driver_applications_payable_balance_nonnegative;
ALTER TABLE public.driver_applications
  ADD CONSTRAINT driver_applications_payable_balance_nonnegative CHECK (payable_balance_cents >= 0);
