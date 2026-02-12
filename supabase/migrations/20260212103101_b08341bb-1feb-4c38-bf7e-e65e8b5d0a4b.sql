
-- Fix: remove overly permissive insert policy, service role bypasses RLS anyway
DROP POLICY "Service role can insert gallery bouquets" ON public.gallery_bouquets;
