-- Add quote-related fields to repair_jobs

ALTER TABLE repair_jobs 
ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,4) DEFAULT 0;

ALTER TABLE repair_jobs 
ADD COLUMN IF NOT EXISTS quote_approved_at TIMESTAMP WITH TIME ZONE;

-- Documentation
COMMENT ON COLUMN repair_jobs.tax_rate IS 'Sales tax rate applied to customer-facing total (e.g., 0.0800 for 8%)';
COMMENT ON COLUMN repair_jobs.quote_approved_at IS 'Timestamp when customer approved the quote';


