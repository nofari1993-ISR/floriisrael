-- Add latitude and longitude columns to shops table
ALTER TABLE public.shops 
ADD COLUMN latitude double precision DEFAULT NULL,
ADD COLUMN longitude double precision DEFAULT NULL;

-- Add index for geospatial queries
CREATE INDEX idx_shops_location ON public.shops (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;