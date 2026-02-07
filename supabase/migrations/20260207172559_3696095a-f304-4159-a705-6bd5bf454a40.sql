-- Add phone column to shops for WhatsApp notifications
ALTER TABLE public.shops ADD COLUMN phone text;

-- Allow anyone to insert orders (customers placing orders aren't authenticated)
CREATE POLICY "Anyone can insert orders"
ON public.orders
FOR INSERT
WITH CHECK (true);

-- Allow anyone to insert order items (tied to order creation)
CREATE POLICY "Anyone can insert order items"
ON public.order_items
FOR INSERT
WITH CHECK (true);