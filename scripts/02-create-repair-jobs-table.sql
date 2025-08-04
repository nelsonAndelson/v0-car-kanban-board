-- Create repair_jobs table for repair bay activity tracking
-- This table tracks every car that goes into a repair bay

CREATE TABLE IF NOT EXISTS repair_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Job classification
    job_type TEXT NOT NULL CHECK (job_type IN ('customer', 'dealer')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'paused', 'awaiting_payment', 'done')),
    
    -- Car information (JSONB for flexibility)
    car_info JSONB NOT NULL DEFAULT '{}',
    
    -- Customer information (for customer jobs)
    customer_info JSONB DEFAULT '{}',
    
    -- Job details
    job_description TEXT NOT NULL,
    technician TEXT NOT NULL,
    
    -- Time tracking
    estimated_hours DECIMAL(5,2) NOT NULL DEFAULT 0,
    actual_hours DECIMAL(5,2),
    time_started TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expected_completion TIMESTAMP WITH TIME ZONE,
    actual_completion TIMESTAMP WITH TIME ZONE,
    
    -- Cost tracking
    estimated_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    actual_cost DECIMAL(10,2),
    
    -- Parts tracking
    parts_ordered BOOLEAN NOT NULL DEFAULT FALSE,
    parts_notes TEXT,
    
    -- Additional notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_repair_jobs_status ON repair_jobs(status);
CREATE INDEX IF NOT EXISTS idx_repair_jobs_job_type ON repair_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_repair_jobs_technician ON repair_jobs(technician);
CREATE INDEX IF NOT EXISTS idx_repair_jobs_time_started ON repair_jobs(time_started);
CREATE INDEX IF NOT EXISTS idx_repair_jobs_created_at ON repair_jobs(created_at);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_repair_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_repair_jobs_updated_at
    BEFORE UPDATE ON repair_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_repair_jobs_updated_at();

-- Add comments for documentation
COMMENT ON TABLE repair_jobs IS 'Tracks every car that goes into a repair bay - "If it goes up, it gets logged"';
COMMENT ON COLUMN repair_jobs.job_type IS 'customer = customer job, dealer = dealer inventory/recon';
COMMENT ON COLUMN repair_jobs.status IS 'pending -> in_progress -> paused -> awaiting_payment -> done';
COMMENT ON COLUMN repair_jobs.car_info IS 'JSON object containing car details (VIN, make, model, year, stock_number, license_plate)';
COMMENT ON COLUMN repair_jobs.customer_info IS 'JSON object containing customer details (name, contact) for customer jobs';
COMMENT ON COLUMN repair_jobs.estimated_hours IS 'Estimated time to complete the job';
COMMENT ON COLUMN repair_jobs.actual_hours IS 'Actual time taken to complete the job';
COMMENT ON COLUMN repair_jobs.estimated_cost IS 'Estimated cost (parts + labor)';
COMMENT ON COLUMN repair_jobs.actual_cost IS 'Actual cost incurred'; 