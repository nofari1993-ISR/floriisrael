
-- Fix flowers SELECT policies: make them PERMISSIVE
DROP POLICY IF EXISTS "Anyone can read flowers" ON public.flowers;
CREATE POLICY "Anyone can read flowers" ON public.flowers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Shop owners can insert flowers" ON public.flowers;
CREATE POLICY "Shop owners can insert flowers" ON public.flowers FOR INSERT WITH CHECK (owns_shop(auth.uid(), shop_id));

DROP POLICY IF EXISTS "Shop owners can update flowers" ON public.flowers;
CREATE POLICY "Shop owners can update flowers" ON public.flowers FOR UPDATE USING (owns_shop(auth.uid(), shop_id));

DROP POLICY IF EXISTS "Shop owners can delete flowers" ON public.flowers;
CREATE POLICY "Shop owners can delete flowers" ON public.flowers FOR DELETE USING (owns_shop(auth.uid(), shop_id));

DROP POLICY IF EXISTS "Admins can insert flowers" ON public.flowers;
CREATE POLICY "Admins can insert flowers" ON public.flowers FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update flowers" ON public.flowers;
CREATE POLICY "Admins can update flowers" ON public.flowers FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete flowers" ON public.flowers;
CREATE POLICY "Admins can delete flowers" ON public.flowers FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix orders SELECT/UPDATE policies
DROP POLICY IF EXISTS "Shop owners can read their orders" ON public.orders;
CREATE POLICY "Shop owners can read their orders" ON public.orders FOR SELECT USING (owns_shop(auth.uid(), shop_id));

DROP POLICY IF EXISTS "Shop owners can update their orders" ON public.orders;
CREATE POLICY "Shop owners can update their orders" ON public.orders FOR UPDATE USING (owns_shop(auth.uid(), shop_id));

DROP POLICY IF EXISTS "Admins can read all orders" ON public.orders;
CREATE POLICY "Admins can read all orders" ON public.orders FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can insert orders" ON public.orders;
CREATE POLICY "Admins can insert orders" ON public.orders FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
CREATE POLICY "Admins can delete orders" ON public.orders FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;
CREATE POLICY "Anyone can insert orders" ON public.orders FOR INSERT WITH CHECK (true);

-- Fix order_items policies
DROP POLICY IF EXISTS "Shop owners can read their order items" ON public.order_items;
CREATE POLICY "Shop owners can read their order items" ON public.order_items FOR SELECT USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND owns_shop(auth.uid(), o.shop_id)));

DROP POLICY IF EXISTS "Admins can read all order items" ON public.order_items;
CREATE POLICY "Admins can read all order items" ON public.order_items FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can insert order items" ON public.order_items;
CREATE POLICY "Admins can insert order items" ON public.order_items FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
CREATE POLICY "Anyone can insert order items" ON public.order_items FOR INSERT WITH CHECK (true);
