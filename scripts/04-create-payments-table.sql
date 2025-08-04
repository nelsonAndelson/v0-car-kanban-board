-- Create payments table for tracking customer payments and outstanding balances
-- This table tracks all payments made by customers for repair jobs

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
    transaction_id TEXT, -- For credit card transactions, check numbers, etc.
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_repair_job_id ON payments(repair_job_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_method ON payments(payment_method);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_payments_updated_at();

-- Add comments for documentation
COMMENT ON TABLE payments IS 'Tracks all customer payments for repair jobs';
COMMENT ON COLUMN payments.repair_job_id IS 'Reference to the repair job this payment is for';
COMMENT ON COLUMN payments.amount IS 'Amount paid in this transaction';
COMMENT ON COLUMN payments.payment_method IS 'Method of payment used';
COMMENT ON COLUMN payments.status IS 'Status of the payment transaction';
COMMENT ON COLUMN payments.transaction_id IS 'External transaction reference (credit card transaction ID, check number, etc.)';

-- Create a view to calculate outstanding balances
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

-- Add payment tracking columns to repair_jobs table
ALTER TABLE repair_jobs 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue'));

ALTER TABLE repair_jobs 
ADD COLUMN IF NOT EXISTS total_paid DECIMAL(10,2) DEFAULT 0;

ALTER TABLE repair_jobs 
ADD COLUMN IF NOT EXISTS outstanding_balance DECIMAL(10,2) DEFAULT 0;

-- Add comments for new columns
COMMENT ON COLUMN repair_jobs.payment_status IS 'Overall payment status for the job';
COMMENT ON COLUMN repair_jobs.total_paid IS 'Total amount paid by customer (calculated from payments table)';
COMMENT ON COLUMN repair_jobs.outstanding_balance IS 'Remaining balance owed by customer (calculated from payments table)'; 