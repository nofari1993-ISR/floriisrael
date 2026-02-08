-- Add boosted flag to flowers table
ALTER TABLE public.flowers ADD COLUMN boosted boolean NOT NULL DEFAULT false;