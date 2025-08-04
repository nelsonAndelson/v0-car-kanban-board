# Repair Bay Activity Tracker

## Overview

The Repair Bay Activity Tracker is a comprehensive system that enforces the rule: **"If it goes up, it gets logged."** Every car that enters a repair bay must be logged in the system, creating accountability, time tracking, and full inventory visibility.

## Key Features

### 🎯 Dual Workflow System

#### Customer Job Workflow

- **Customer Information**: Name, contact details
- **Vehicle Information**: VIN, make, model, year
- **Job Details**: Description, estimated time/cost
- **Status Tracking**: Pending → In Progress → Awaiting Payment → Done
- **Financial Tracking**: Estimated price, parts ordered, amount collected

#### Dealer Inventory (Recon) Workflow

- **Internal Identification**: Stock number, license plate
- **Vehicle Information**: Make, model, VIN
- **Recon Details**: Job description, technician assignment
- **Cost Tracking**: Internal cost (parts + labor estimate)
- **Completion Tracking**: Drop-off date, actual completion date

### 🔄 Repair Bay Flow Logic

1. **Job Intake**: Technician selects job type (Customer/Internal)
2. **Details Input**: Car info, work description, time started (auto-timestamped)
3. **Status Updates**: In Progress → Paused (awaiting parts) → Done
4. **Final Update**: Job completion, time taken, notes

### 📈 KPI Tracking

From this process, you can track:

- **Technician Productivity**: Billed hours vs. clocked hours
- **Cost per Recon Unit**: Track recon costs for inventory pricing
- **Average Time per Job**: Detect bottlenecks in workflow
- **Stalled Jobs**: Cars in bay > X days
- **Part Delays**: vs. customer payment delays

## Database Schema

### repair_jobs Table

```sql
CREATE TABLE repair_jobs (
    id UUID PRIMARY KEY,
    job_type TEXT CHECK (job_type IN ('customer', 'dealer')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'paused', 'awaiting_payment', 'done')),
    car_info JSONB, -- Flexible car details
    customer_info JSONB, -- Customer details for customer jobs
    job_description TEXT,
    technician TEXT,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    parts_ordered BOOLEAN,
    parts_notes TEXT,
    time_started TIMESTAMP WITH TIME ZONE,
    expected_completion TIMESTAMP WITH TIME ZONE,
    actual_completion TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);
```

## Usage Examples

### Example: Customer Job

```
Job Type: Customer Job
Customer: John Smith (555-0123)
Vehicle: 2018 Honda Civic (VIN: 1HGBH41JXMN109186)
Job: Brake replacement, oil change
Technician: Mike Johnson
Estimated: 3 hours, $450
Status: In Progress
```

### Example: Dealer Recon

```
Job Type: Dealer Inventory (Recon)
Stock #: INV-2024-001
Vehicle: 2014 Chevrolet Malibu
Job: Front brakes + AC recharge
Technician: Sarah Wilson
Estimated: 3 hours, $150 parts
Status: In Progress
Completion: 8/6/2025
Notes: AC needed extra flush, added $40 in parts
```

## Setup Instructions

1. **Run Database Script**: Execute `scripts/02-create-repair-jobs-table.sql` in your Supabase database
2. **Access the Tracker**: Navigate to `/repair-bay` in the application
3. **Start Logging**: Click "Log New Job" to begin tracking repair bay activity

## Business Rules

1. **Mandatory Logging**: No car enters a bay without being logged
2. **Real-time Updates**: Status changes are tracked in real-time
3. **Cost Accountability**: All costs (parts + labor) must be recorded
4. **Time Tracking**: Actual vs. estimated time is tracked for productivity analysis
5. **Parts Tracking**: Parts ordering status and notes are maintained

## Benefits

- **Full Visibility**: Know exactly what's in each bay at all times
- **Cost Control**: Track recon costs for proper inventory pricing
- **Productivity Analysis**: Monitor technician efficiency
- **Customer Service**: Track customer job progress and communication
- **Inventory Management**: Know why cars aren't ready for sale

## Integration

The Repair Bay Tracker integrates with the existing Car Turnover Kanban system, providing a complete view of vehicle lifecycle from acquisition through repair to sale.
