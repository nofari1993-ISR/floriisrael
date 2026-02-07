
-- Add owner_id to shops table so we can link shop owners
ALTER TABLE public.shops ADD COLUMN owner_id uuid;

-- Create a function to check if user owns a specific shop
CREATE OR REPLACE FUNCTION public.owns_shop(_user_id uuid, _shop_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.shops WHERE id = _shop_id AND owner_id = _user_id
  )
$$;

-- Create a function to get the shop id for an owner
CREATE OR REPLACE FUNCTION public.get_owner_shop_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.shops WHERE owner_id = _user_id LIMIT 1
$$;

-- Create flowers (inventory) table
CREATE TABLE public.flowers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text,
  price numeric NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 0,
  image text,
  in_stock boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.flowers ENABLE ROW LEVEL SECURITY;

-- Anyone can view flowers (for marketplace)
CREATE POLICY "Anyone can read flowers"
ON public.flowers FOR SELECT
USING (true);

-- Shop owners can manage their own flowers
CREATE POLICY "Shop owners can insert flowers"
ON public.flowers FOR INSERT
WITH CHECK (public.owns_shop(auth.uid(), shop_id));

CREATE POLICY "Shop owners can update flowers"
ON public.flowers FOR UPDATE
USING (public.owns_shop(auth.uid(), shop_id));

CREATE POLICY "Shop owners can delete flowers"
ON public.flowers FOR DELETE
USING (public.owns_shop(auth.uid(), shop_id));

-- Admins can manage all flowers
CREATE POLICY "Admins can insert flowers"
ON public.flowers FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update flowers"
ON public.flowers FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete flowers"
ON public.flowers FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Create orders table
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_email text,
  customer_phone text,
  recipient_name text NOT NULL,
  delivery_address text NOT NULL,
  delivery_date date NOT NULL,
  greeting text,
  status text NOT NULL DEFAULT 'ממתינה',
  notes text,
  total_price numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Shop owners can view their orders
CREATE POLICY "Shop owners can read their orders"
ON public.orders FOR SELECT
USING (public.owns_shop(auth.uid(), shop_id));

-- Shop owners can update their orders (status, notes)
CREATE POLICY "Shop owners can update their orders"
ON public.orders FOR UPDATE
USING (public.owns_shop(auth.uid(), shop_id));

-- Admins can do everything with orders
CREATE POLICY "Admins can read all orders"
ON public.orders FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert orders"
ON public.orders FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update orders"
ON public.orders FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete orders"
ON public.orders FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Create order_items table
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  flower_id uuid REFERENCES public.flowers(id),
  flower_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Order items follow the same access as orders
CREATE POLICY "Shop owners can read their order items"
ON public.order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_id AND public.owns_shop(auth.uid(), o.shop_id)
  )
);

CREATE POLICY "Admins can read all order items"
ON public.order_items FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert order items"
ON public.order_items FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_flowers_updated_at
BEFORE UPDATE ON public.flowers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update shops RLS: shop owners can update their own shop
CREATE POLICY "Shop owners can update their shop"
ON public.shops FOR UPDATE
USING (owner_id = auth.uid());
