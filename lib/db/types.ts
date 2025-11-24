// Car types
export type CarStatus = "Acquired" | "Prep" | "Showcase" | "Ready";

export type Car = {
  id: string;
  year: number;
  make: string;
  model: string;
  color: string;
  status: CarStatus;
  updated_at: string;
};

// Task types
export type TaskPriority = "low" | "medium" | "high";

export type Task = {
  id: string;
  car_id: string;
  title: string;
  description?: string;
  is_completed: boolean;
  priority: TaskPriority;
  created_at: string;
  updated_at: string;
};

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
  quantity?: number;
  created_at: string;
  updated_at: string;
};

export type CarInfo = {
  vin?: string;
  make?: string;
  model?: string;
  year?: string;
  stock_number?: string;
  license_plate?: string;
};

export type CustomerInfo = {
  name: string;
  contact: string;
};

export type RepairJob = {
  id: string;
  job_type: JobType;
  status: JobStatus;
  car_info: CarInfo;
  customer_info?: CustomerInfo;
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
  payment_status?: JobPaymentStatus;
  total_paid?: number;
  outstanding_balance?: number;
  tax_rate?: number;
  quote_approved_at?: string;
  created_at: string;
  updated_at: string;
};
