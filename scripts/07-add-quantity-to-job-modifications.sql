-- Add quantity to job_modifications to support multiple units per line

ALTER TABLE job_modifications
ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1;

COMMENT ON COLUMN job_modifications.quantity IS 'Quantity of the item for this modification/quote line';


