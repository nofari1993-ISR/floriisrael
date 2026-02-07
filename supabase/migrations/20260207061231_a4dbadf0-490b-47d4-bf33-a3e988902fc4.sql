
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS for user_roles: only admins can read
CREATE POLICY "Admins can read user_roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create shops table
CREATE TABLE public.shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  rating NUMERIC(2,1) DEFAULT 5.0,
  reviews INTEGER DEFAULT 0,
  speciality TEXT DEFAULT 'כללי',
  image TEXT DEFAULT '🌼',
  hours TEXT DEFAULT '09:00 - 18:00',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

-- Everyone can read shops
CREATE POLICY "Anyone can read shops"
  ON public.shops FOR SELECT
  USING (true);

-- Only admins can insert shops
CREATE POLICY "Admins can insert shops"
  ON public.shops FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update shops
CREATE POLICY "Admins can update shops"
  ON public.shops FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete shops
CREATE POLICY "Admins can delete shops"
  ON public.shops FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_shops_updated_at
  BEFORE UPDATE ON public.shops
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial shops data
INSERT INTO public.shops (name, location, rating, reviews, speciality, image, hours, tags) VALUES
  ('פרחי הגן', 'תל אביב, רוטשילד 42', 4.9, 234, 'זרים רומנטיים', '🌹', '08:00 - 20:00', ARRAY['משלוח מהיר', 'DIY']),
  ('בלום בוטיק', 'ירושלים, אמילי זולא 15', 4.8, 189, 'עיצוב מודרני', '🌸', '09:00 - 21:00', ARRAY['פרימיום', 'אירועים']),
  ('הפרח הירוק', 'חיפה, הנביאים 8', 4.7, 156, 'פרחי שדה', '🌿', '07:30 - 19:00', ARRAY['אורגני', 'מקומי']),
  ('סחלב פרחים', 'הרצליה, סוקולוב 22', 4.9, 312, 'סידורי יוקרה', '🌺', '08:00 - 22:00', ARRAY['יוקרה', '24/7 משלוח']);
