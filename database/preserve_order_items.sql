-- Migration to preserve order item data when products are deleted
-- This adds product_name column and changes foreign key behavior

-- Step 1: Add product_name column to store the product name at time of order
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_name VARCHAR(255);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_category VARCHAR(255);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);

-- Step 2: Update existing records with product names from products table
UPDATE order_items oi
SET 
    product_name = p.name,
    product_category = p.category,
    company_name = c.name
FROM products p
JOIN companies c ON p.company_id = c.id
WHERE oi.product_id = p.id AND oi.product_name IS NULL;

-- Step 3: Change the foreign key to SET NULL instead of CASCADE
-- First drop the existing constraint
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;

-- Add back with ON DELETE SET NULL
ALTER TABLE order_items 
ADD CONSTRAINT order_items_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;

-- Make product_id nullable
ALTER TABLE order_items ALTER COLUMN product_id DROP NOT NULL;