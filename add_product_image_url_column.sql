-- Add product image URL column (required for product image upload feature)
-- Run in pgAdmin or Supabase SQL Editor against an existing database.

ALTER TABLE public."Products"
ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) NULL;

-- If columns are still PascalCase (schema not migrated to snake_case yet), use:
-- ALTER TABLE public."Products" ADD COLUMN IF NOT EXISTS "ImageUrl" VARCHAR(500) NULL;
