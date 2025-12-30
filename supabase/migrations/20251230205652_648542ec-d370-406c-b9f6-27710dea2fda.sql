-- Add categories column to reels table
ALTER TABLE public.reels 
ADD COLUMN categories text[] DEFAULT '{}';

-- Add categories column to lives table
ALTER TABLE public.lives 
ADD COLUMN categories text[] DEFAULT '{}';

-- Add categories column to products table
ALTER TABLE public.products 
ADD COLUMN categories text[] DEFAULT '{}';

-- Create index for better filtering performance
CREATE INDEX idx_reels_categories ON public.reels USING GIN(categories);
CREATE INDEX idx_lives_categories ON public.lives USING GIN(categories);
CREATE INDEX idx_products_categories ON public.products USING GIN(categories);