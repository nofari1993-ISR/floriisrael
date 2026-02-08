-- Add shelf life tracking to flowers
ALTER TABLE public.flowers 
ADD COLUMN shelf_life_days integer NOT NULL DEFAULT 7,
ADD COLUMN last_restocked_at timestamp with time zone NOT NULL DEFAULT now();

-- Initialize last_restocked_at from created_at for existing flowers
UPDATE public.flowers SET last_restocked_at = COALESCE(created_at, now());
