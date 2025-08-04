-- Create additional_costs table for tracking extra expenses during jobs
-- This table tracks additional parts, supplies, or expenses incurred during repair jobs

CREATE TABLE IF NOT EXISTS additional_costs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Reference to repair job
    repair_job_id UUID NOT NULL REFERENCES repair_jobs(id) ON DELETE CASCADE,
    
    -- Cost details
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    supplier TEXT, -- e.g., AutoZone, NAPA, etc.
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create job_modifications table for tracking additional work items added to jobs
-- This table tracks when technicians add new work items to existing jobs

CREATE TABLE IF NOT EXISTS job_modifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Reference to repair job
    repair_job_id UUID NOT NULL REFERENCES repair_jobs(id) ON DELETE CASCADE,
    
    -- Modification details
    description TEXT NOT NULL,
    estimated_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    customer_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_additional_costs_repair_job_id ON additional_costs(repair_job_id);
CREATE INDEX IF NOT EXISTS idx_additional_costs_created_at ON additional_costs(created_at);
CREATE INDEX IF NOT EXISTS idx_job_modifications_repair_job_id ON job_modifications(repair_job_id);
CREATE INDEX IF NOT EXISTS idx_job_modifications_created_at ON job_modifications(created_at);

-- Create functions to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_additional_costs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_job_modifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
CREATE TRIGGER trigger_update_additional_costs_updated_at
    BEFORE UPDATE ON additional_costs
    FOR EACH ROW
    EXECUTE FUNCTION update_additional_costs_updated_at();

CREATE TRIGGER trigger_update_job_modifications_updated_at
    BEFORE UPDATE ON job_modifications
    FOR EACH ROW
    EXECUTE FUNCTION update_job_modifications_updated_at();

-- Add comments for documentation
COMMENT ON TABLE additional_costs IS 'Tracks additional expenses incurred during repair jobs (parts, supplies, etc.)';
COMMENT ON COLUMN additional_costs.repair_job_id IS 'Reference to the repair job this cost is for';
COMMENT ON COLUMN additional_costs.amount IS 'Amount of the additional cost';
COMMENT ON COLUMN additional_costs.description IS 'Description of what the cost is for';
COMMENT ON COLUMN additional_costs.supplier IS 'Supplier where the item was purchased (e.g., AutoZone, NAPA)';

COMMENT ON TABLE job_modifications IS 'Tracks additional work items added to existing repair jobs';
COMMENT ON COLUMN job_modifications.repair_job_id IS 'Reference to the repair job this modification is for';
COMMENT ON COLUMN job_modifications.description IS 'Description of the additional work item';
COMMENT ON COLUMN job_modifications.estimated_cost IS 'Cost to the shop for this work item';
COMMENT ON COLUMN job_modifications.customer_price IS 'Price charged to customer for this work item';

-- Create a view to calculate total costs including additional costs and modifications
CREATE OR REPLACE VIEW job_total_costs AS
SELECT 
    rj.id as repair_job_id,
    rj.estimated_cost as base_cost,
    COALESCE(SUM(ac.amount), 0) as additional_costs,
    COALESCE(SUM(jm.estimated_cost), 0) as modifications_cost,
    (rj.estimated_cost + COALESCE(SUM(ac.amount), 0) + COALESCE(SUM(jm.estimated_cost), 0)) as total_cost,
    rj.customer_price as base_price,
    COALESCE(SUM(jm.customer_price), 0) as modifications_price,
    (rj.customer_price + COALESCE(SUM(jm.customer_price), 0)) as total_price
FROM repair_jobs rj
LEFT JOIN additional_costs ac ON rj.id = ac.repair_job_id
LEFT JOIN job_modifications jm ON rj.id = jm.repair_job_id
GROUP BY rj.id, rj.estimated_cost, rj.customer_price; 