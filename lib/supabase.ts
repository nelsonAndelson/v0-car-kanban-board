import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-anon-key";

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Car = {
  id: string;
  year: number;
  make: string;
  model: string;
  color: string;
  status: "Acquired" | "Prep" | "Showcase" | "Ready";
  updated_at: string;
};

export type Task = {
  id: string;
  car_id: string;
  title: string;
  description?: string;
  is_completed: boolean;
  priority: "low" | "medium" | "high";
  created_at: string;
  updated_at: string;
};

// Add CarWithTasks type
export type CarWithTasks = Car & {
  tasks: Task[];
};

// Repair Job types
export type JobType = "customer" | "dealer";
export type JobStatus =
  | "pending"
  | "in_progress"
  | "paused"
  | "awaiting_payment"
  | "done";

export type PaymentMethod =
  | "cash"
  | "credit_card"
  | "debit_card"
  | "check"
  | "bank_transfer"
  | "financing"
  | "insurance";
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";
export type JobPaymentStatus = "pending" | "partial" | "paid" | "overdue";

export type Payment = {
  id: string;
  repair_job_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string;
  status: PaymentStatus;
  transaction_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
};

export type AdditionalCost = {
  id: string;
  repair_job_id: string;
  amount: number;
  description: string;
  supplier?: string;
  created_at: string;
  updated_at: string;
};

export type JobModification = {
  id: string;
  repair_job_id: string;
  description: string;
  estimated_cost: number;
  customer_price: number;
  created_at: string;
  updated_at: string;
};

export type RepairJob = {
  id: string;
  job_type: JobType;
  status: JobStatus;
  car_info: {
    vin?: string;
    make?: string;
    model?: string;
    year?: string;
    stock_number?: string;
    license_plate?: string;
  };
  customer_info?: {
    name: string;
    contact: string;
  };
  job_description: string;
  technician: string;
  estimated_hours: number;
  actual_hours?: number;
  estimated_cost: number;
  customer_price?: number;
  actual_cost?: number;
  parts_ordered: boolean;
  parts_notes?: string;
  time_started: string;
  expected_completion?: string;
  actual_completion?: string;
  notes?: string;
  // Payment tracking fields
  payment_status?: JobPaymentStatus;
  total_paid?: number;
  outstanding_balance?: number;
  created_at: string;
  updated_at: string;
};
