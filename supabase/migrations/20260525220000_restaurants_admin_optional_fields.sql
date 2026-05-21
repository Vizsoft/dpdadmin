-- Admin panel creates restaurants with partner + name only; remote schema required zone_id.

ALTER TABLE public.restaurants
  ALTER COLUMN zone_id DROP NOT NULL;
