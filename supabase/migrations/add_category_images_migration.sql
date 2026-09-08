-- =========================================================================
-- Category Images and Commission Migration
-- =========================================================================

-- 1. Add image_url to categories table
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Add commission_percentage to categories table
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS commission_percentage NUMERIC(5, 2) DEFAULT 4.0;

-- 3. Populate default images for canonical 14 Kerala categories
UPDATE public.categories SET image_url = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80' WHERE name = 'Fresh Vegetables' AND image_url IS NULL;
UPDATE public.categories SET image_url = 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600&auto=format&fit=crop&q=80' WHERE name = 'Fresh Fruits' AND image_url IS NULL;
UPDATE public.categories SET image_url = 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80' WHERE name = 'Rice, Atta & Flours' AND image_url IS NULL;
UPDATE public.categories SET image_url = 'https://images.unsplash.com/photo-1585994192701-f1a505c817ea?w=600&auto=format&fit=crop&q=80' WHERE name = 'Dals, Pulses & Beans' AND image_url IS NULL;
UPDATE public.categories SET image_url = 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80' WHERE name = 'Dairy' AND image_url IS NULL;
UPDATE public.categories SET image_url = 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80' WHERE name = 'Oils & Ghee' AND image_url IS NULL;
UPDATE public.categories SET image_url = 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80' WHERE name = 'Spices & Masalas' AND image_url IS NULL;
UPDATE public.categories SET image_url = 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80' WHERE name = 'Bakery' AND image_url IS NULL;
UPDATE public.categories SET image_url = 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80' WHERE name = 'Biscuits & Cookies' AND image_url IS NULL;
UPDATE public.categories SET image_url = 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=600&auto=format&fit=crop&q=80' WHERE name = 'Dry Fruits & Cereals' AND image_url IS NULL;
UPDATE public.categories SET image_url = 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80' WHERE name = 'Beverages' AND image_url IS NULL;
UPDATE public.categories SET image_url = 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=600&auto=format&fit=crop&q=80' WHERE name = 'Desserts & Ice Creams' AND image_url IS NULL;
UPDATE public.categories SET image_url = 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&auto=format&fit=crop&q=80' WHERE name = 'Meat & Fish' AND image_url IS NULL;
UPDATE public.categories SET image_url = 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&auto=format&fit=crop&q=80' WHERE name = 'Household & Stationery' AND image_url IS NULL;
