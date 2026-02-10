-- Add boosted_at column to track when boost was activated
ALTER TABLE public.flowers ADD COLUMN boosted_at timestamp with time zone DEFAULT NULL;

-- Update existing boosted flowers to have boosted_at = now (so they expire in 5 days from now)
UPDATE public.flowers SET boosted_at = now() WHERE boosted = true;
