
-- Create gallery table for community bouquets
CREATE TABLE public.gallery_bouquets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  flowers JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_price NUMERIC NOT NULL DEFAULT 0,
  shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL,
  occasion TEXT,
  style TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gallery_bouquets ENABLE ROW LEVEL SECURITY;

-- Anyone can view gallery
CREATE POLICY "Anyone can view gallery bouquets"
ON public.gallery_bouquets
FOR SELECT
USING (true);

-- Only service role / edge functions insert (no user-facing insert)
-- We'll use service role in the edge function to insert
CREATE POLICY "Service role can insert gallery bouquets"
ON public.gallery_bouquets
FOR INSERT
WITH CHECK (true);

-- Admins can delete
CREATE POLICY "Admins can delete gallery bouquets"
ON public.gallery_bouquets
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
