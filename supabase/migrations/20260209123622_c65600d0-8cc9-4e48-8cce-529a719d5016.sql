
-- Create reviews table
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews
CREATE POLICY "Anyone can read reviews"
  ON public.reviews FOR SELECT
  USING (true);

-- Anyone can insert reviews (no auth required for customers)
CREATE POLICY "Anyone can insert reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (true);

-- Admins can delete reviews
CREATE POLICY "Admins can delete reviews"
  ON public.reviews FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Shop owners can delete reviews on their shop
CREATE POLICY "Shop owners can delete their shop reviews"
  ON public.reviews FOR DELETE
  USING (owns_shop(auth.uid(), shop_id));

-- Function to update shop rating average
CREATE OR REPLACE FUNCTION public.update_shop_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.shops
  SET rating = (
    SELECT COALESCE(ROUND(AVG(r.rating)::numeric, 1), 5.0)
    FROM public.reviews r
    WHERE r.shop_id = COALESCE(NEW.shop_id, OLD.shop_id)
  ),
  reviews = (
    SELECT COUNT(*)::integer
    FROM public.reviews r
    WHERE r.shop_id = COALESCE(NEW.shop_id, OLD.shop_id)
  )
  WHERE id = COALESCE(NEW.shop_id, OLD.shop_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger to auto-update shop rating on review changes
CREATE TRIGGER update_shop_rating_on_review
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_shop_rating();
