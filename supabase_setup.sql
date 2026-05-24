-- Run this in your Supabase SQL Editor

-- Ensure the 'item-images' bucket exists and is public
insert into storage.buckets (id, name, public)
values ('item-images', 'item-images', true)
on conflict (id) do update set public = true;

-- Enable RLS on storage.objects (if not already enabled)
alter table storage.objects enable row level security;

-- Drop previous policies to avoid conflicts
drop policy if exists "Public Access to item-images" on storage.objects;
drop policy if exists "Vendors can upload item images" on storage.objects;
drop policy if exists "Vendors can update item images" on storage.objects;
drop policy if exists "Vendors can delete item images" on storage.objects;

-- Policy 1: Allow public read access to the item-images bucket
create policy "Public Access to item-images"
  on storage.objects for select
  using ( bucket_id = 'item-images' );

-- Policy 2: Allow inserts (uploads) to the item-images bucket
create policy "Vendors can upload item images"
  on storage.objects for insert
  with check ( bucket_id = 'item-images' );

-- Policy 3: Allow updates
create policy "Vendors can update item images"
  on storage.objects for update
  using ( bucket_id = 'item-images' );

-- Policy 4: Allow deletions
create policy "Vendors can delete item images"
  on storage.objects for delete
  using ( bucket_id = 'item-images' );
