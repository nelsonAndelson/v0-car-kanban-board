-- Add customer_price column to repair_jobs table
-- This tracks the price charged to customers vs. cost to us

ALTER TABLE repair_jobs 
ADD COLUMN IF NOT EXISTS customer_price DECIMAL(10,2) DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN repair_jobs.customer_price IS 'Price charged to customer (different from estimated_cost which is cost to us)'; 