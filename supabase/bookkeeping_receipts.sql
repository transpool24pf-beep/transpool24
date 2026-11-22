-- Monthly bookkeeping inbox (Belege for Steuerberater).
-- Run once in Supabase → SQL Editor.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.bookkeeping_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_filename TEXT,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  vendor_name TEXT,
  document_date DATE,
  gross_cents INTEGER,
  net_cents INTEGER,
  vat_cents INTEGER,
  vat_rate NUMERIC(5, 2),
  currency TEXT NOT NULL DEFAULT 'EUR',
  category TEXT,
  invoice_number TEXT,
  notes TEXT,
  ocr_raw JSONB,
  ocr_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (ocr_status IN ('pending', 'done', 'failed', 'skipped')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bookkeeping_receipts_document_date_idx
  ON public.bookkeeping_receipts (document_date DESC NULLS LAST, created_at DESC);

ALTER TABLE public.bookkeeping_receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only bookkeeping_receipts" ON public.bookkeeping_receipts;
CREATE POLICY "Service role only bookkeeping_receipts"
  ON public.bookkeeping_receipts
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

INSERT INTO storage.buckets (id, name, public)
VALUES ('bookkeeping', 'bookkeeping', false)
ON CONFLICT (id) DO NOTHING;
