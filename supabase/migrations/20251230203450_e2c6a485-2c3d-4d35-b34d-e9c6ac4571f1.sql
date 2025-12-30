-- Drop and recreate the type check constraint to allow more product types
ALTER TABLE public.products DROP CONSTRAINT products_type_check;

ALTER TABLE public.products ADD CONSTRAINT products_type_check 
CHECK (type = ANY (ARRAY['pack'::text, 'video'::text, 'vip'::text, 'promo'::text]));