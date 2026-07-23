-- NexaForce Quotes Table Schema
-- Run this inside your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query).

-- 1) Create quotes table
CREATE TABLE IF NOT EXISTS public.quotes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT,
  service     TEXT NOT NULL,
  message     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Enable Row Level Security (RLS)
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- 3) Policy: Allow public (anon) website form submissions to insert quote requests
CREATE POLICY "Public can insert quotes"
  ON public.quotes FOR INSERT
  TO anon
  WITH CHECK (true);

-- 4) Policy: Allow public / service role to read quote requests
CREATE POLICY "Public can read quotes"
  ON public.quotes FOR SELECT
  TO anon
  USING (true);
