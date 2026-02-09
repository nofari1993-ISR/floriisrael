
-- Remove overly permissive "Anyone can insert" policies
-- Orders and order_items are created via edge function with service role key (bypasses RLS)
-- So these public INSERT policies are unnecessary and a security risk

DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
