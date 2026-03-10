-- Add binary inventory columns
ALTER TABLE public.flowers
  ADD COLUMN IF NOT EXISTS is_available boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_boosted   boolean NOT NULL DEFAULT false;

-- Copy existing state
UPDATE public.flowers SET is_available = in_stock;
UPDATE public.flowers SET is_boosted   = boosted;
