-- Add email column to shops for order notification emails
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS email text;
