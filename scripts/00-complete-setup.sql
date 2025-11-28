-- ============================================
-- COMPLETE DATABASE SETUP FOR REPAIR BAY TRACKER
-- ============================================
-- Run this script in your Supabase SQL Editor
-- This combines all migration scripts in the correct order
-- ============================================

-- Step 1: Create repair_jobs table (base table)
-- ============================================
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
    customer_price DECIMAL(10,2) DEFAULT 0,
    
    -- Parts tracking
    parts_ordered BOOLEAN NOT NULL DEFAULT FALSE,
    parts_notes TEXT,
    
    -- Payment tracking
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue')),
    total_paid DECIMAL(10,2) DEFAULT 0,
    outstanding_balance DECIMAL(10,2) DEFAULT 0,
    
    -- Quote fields
    tax_rate DECIMAL(5,4) DEFAULT 0,
    quote_approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Additional notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Step 2: Create payments table
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Reference to repair job
    repair_job_id UUID NOT NULL REFERENCES repair_jobs(id) ON DELETE CASCADE,
    
    -- Payment details
    amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'credit_card', 'debit_card', 'check', 'bank_transfer', 'financing', 'insurance')),
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Payment status
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    
    -- Reference information
    transaction_id TEXT,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Step 3: Create additional_costs table
-- ============================================
CREATE TABLE IF NOT EXISTS additional_costs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Reference to repair job
    repair_job_id UUID NOT NULL REFERENCES repair_jobs(id) ON DELETE CASCADE,
    
    -- Cost details
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    supplier TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Step 4: Create job_modifications table
-- ============================================
CREATE TABLE IF NOT EXISTS job_modifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Reference to repair job
    repair_job_id UUID NOT NULL REFERENCES repair_jobs(id) ON DELETE CASCADE,
    
    -- Modification details
    description TEXT NOT NULL,
    estimated_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    customer_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    quantity INTEGER NOT NULL DEFAULT 1,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Step 5: Create indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_repair_jobs_status ON repair_jobs(status);
CREATE INDEX IF NOT EXISTS idx_repair_jobs_job_type ON repair_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_repair_jobs_technician ON repair_jobs(technician);
CREATE INDEX IF NOT EXISTS idx_repair_jobs_time_started ON repair_jobs(time_started);
CREATE INDEX IF NOT EXISTS idx_repair_jobs_created_at ON repair_jobs(created_at);

CREATE INDEX IF NOT EXISTS idx_payments_repair_job_id ON payments(repair_job_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_method ON payments(payment_method);

CREATE INDEX IF NOT EXISTS idx_additional_costs_repair_job_id ON additional_costs(repair_job_id);
CREATE INDEX IF NOT EXISTS idx_additional_costs_created_at ON additional_costs(created_at);

CREATE INDEX IF NOT EXISTS idx_job_modifications_repair_job_id ON job_modifications(repair_job_id);
CREATE INDEX IF NOT EXISTS idx_job_modifications_created_at ON job_modifications(created_at);

-- Step 6: Create update triggers
-- ============================================
CREATE OR REPLACE FUNCTION update_repair_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

DROP TRIGGER IF EXISTS trigger_update_repair_jobs_updated_at ON repair_jobs;
CREATE TRIGGER trigger_update_repair_jobs_updated_at
    BEFORE UPDATE ON repair_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_repair_jobs_updated_at();

DROP TRIGGER IF EXISTS trigger_update_payments_updated_at ON payments;
CREATE TRIGGER trigger_update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_payments_updated_at();

DROP TRIGGER IF EXISTS trigger_update_additional_costs_updated_at ON additional_costs;
CREATE TRIGGER trigger_update_additional_costs_updated_at
    BEFORE UPDATE ON additional_costs
    FOR EACH ROW
    EXECUTE FUNCTION update_additional_costs_updated_at();

DROP TRIGGER IF EXISTS trigger_update_job_modifications_updated_at ON job_modifications;
CREATE TRIGGER trigger_update_job_modifications_updated_at
    BEFORE UPDATE ON job_modifications
    FOR EACH ROW
    EXECUTE FUNCTION update_job_modifications_updated_at();

-- Step 7: Create helpful views
-- ============================================
CREATE OR REPLACE VIEW job_payment_summary AS
SELECT 
    rj.id as repair_job_id,
    rj.customer_price,
    COALESCE(SUM(p.amount), 0) as total_paid,
    (rj.customer_price - COALESCE(SUM(p.amount), 0)) as outstanding_balance,
    CASE 
        WHEN (rj.customer_price - COALESCE(SUM(p.amount), 0)) <= 0 THEN 'paid'
        WHEN (rj.customer_price - COALESCE(SUM(p.amount), 0)) > 0 THEN 'outstanding'
        ELSE 'unknown'
    END as payment_status
FROM repair_jobs rj
LEFT JOIN payments p ON rj.id = p.repair_job_id AND p.status = 'completed'
WHERE rj.job_type = 'customer'
GROUP BY rj.id, rj.customer_price;

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

-- Step 8: DISABLE RLS (Row Level Security) for public access
-- ============================================
-- This allows the anon key to access all tables without authentication
-- For production, you should enable RLS and create proper policies

ALTER TABLE repair_jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE additional_costs DISABLE ROW LEVEL SECURITY;
ALTER TABLE job_modifications DISABLE ROW LEVEL SECURITY;

-- Step 9: Grant permissions to anon role
-- ============================================
-- Ensure the anon role can perform all necessary operations
GRANT ALL ON repair_jobs TO anon, authenticated;
GRANT ALL ON payments TO anon, authenticated;
GRANT ALL ON additional_costs TO anon, authenticated;
GRANT ALL ON job_modifications TO anon, authenticated;

-- Step 10: Add table comments for documentation
-- ============================================
COMMENT ON TABLE repair_jobs IS 'Tracks every car that goes into a repair bay - "If it goes up, it gets logged"';
COMMENT ON TABLE payments IS 'Tracks all customer payments for repair jobs';
COMMENT ON TABLE additional_costs IS 'Tracks additional expenses incurred during repair jobs (parts, supplies, etc.)';
COMMENT ON TABLE job_modifications IS 'Tracks additional work items added to existing repair jobs';

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- You should now be able to use the repair bay tracker.
-- Refresh your application and the error should be gone.
-- ============================================

