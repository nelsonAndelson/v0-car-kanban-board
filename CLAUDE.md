# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Car Turnover Kanban Board - A dual-purpose dealership management system with:
1. **Kanban Board** (`/`) - Tracks dealer inventory through sales pipeline (Acquired → Prep → Showcase → Ready)
2. **Repair Bay Tracker** (`/repair-bay`) - Enforces "If it goes up, it gets logged" rule for all repair work

## Tech Stack

- **Framework**: Next.js 15 (App Router) with React 19, TypeScript
- **Database**: Supabase (PostgreSQL) with Realtime subscriptions
- **Drag & Drop**: @dnd-kit/core (for kanban), @dnd-kit/sortable
- **UI Components**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS

## Development Commands

```bash
# Development server (runs on port 3000)
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Lint code
npm run lint

# Auto-fix linting issues
npm run lint:fix
```

## Database Setup

Run SQL scripts in order in your Supabase SQL editor:

```bash
scripts/01-create-cars-table.sql          # Cars and tasks tables
scripts/02-create-repair-jobs-table.sql   # Repair jobs tracking
scripts/03-add-customer-price.sql         # Customer pricing field
scripts/04-create-payments-table.sql      # Payment tracking
scripts/05-create-job-modifications-table.sql  # Job modifications & additional costs
scripts/06-add-quote-fields.sql           # Quote approval fields
scripts/07-add-quantity-to-job-modifications.sql  # Quantity tracking
```

Environment variables required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

## Architecture

### Core Data Models

All database types are defined in `lib/db/types.ts`:

**Kanban System**:
- `Car` - Vehicle inventory (year, make, model, color, status)
- `Task` - Checklist items attached to cars
- `CarWithTasks` - Combined type for cars with their tasks

**Repair Bay System**:
- `RepairJob` - Main job tracking (customer vs dealer jobs)
- `Payment` - Customer payment records
- `JobModification` - Additional work items added to jobs
- `AdditionalCost` - Extra parts/expenses during jobs

### Key Patterns

1. **Dual Workflow Jobs**:
   - **Customer Jobs**: Full customer info, payment tracking, quote generation (`/repair-bay/quote/[id]`)
   - **Dealer Jobs**: Internal recon work, cost tracking only

2. **Real-time Updates**: Both systems use Supabase Realtime subscriptions
   - Kanban: Listens to `cars` and `tasks` table changes
   - Repair Bay: Listens to `repair_jobs`, `payments`, `job_modifications`, `additional_costs`

3. **Import Aliases**: `@/` maps to project root (configured in `tsconfig.json`)

4. **Type Safety**:
   - All Supabase types defined in `lib/db/types.ts`
   - Database client in `lib/db/client.ts`
   - Use typed selects with Supabase queries (see `app/repair-bay/quote/[id]/page.tsx` for examples)

### File Structure

```
app/
  page.tsx                           # Homepage with feature overview
  inventory/
    page.tsx                         # Kanban board for inventory tracking
  repair-bay/
    page.tsx                         # Repair bay tracker listing
    quote/[id]/page.tsx              # Customer job quote/invoice page

components/
  features/                          # Feature-specific components
    kanban/
      kanban-column.tsx              # Kanban column with drag-drop
      car-card.tsx                   # Individual car cards
      sortable-car-card.tsx          # Sortable wrapper for drag-drop
      add-car-form.tsx               # Form to add new cars
      car-details-modal.tsx          # Car details with task management
    repair-bay/
      job-edit-modal.tsx             # Edit repair job details
      payment-modal.tsx              # Record customer payments
      pnl-breakdown-modal.tsx        # Profit/loss analysis
      floating-add-button.tsx        # Floating action button
    tasks/
      add-task-form.tsx              # Form to add tasks to cars
      task-item.tsx                  # Individual task display
  layout/                            # Layout components
    navbar.tsx                       # Main navigation
    footer.tsx                       # Footer with links and info
    quick-stats-bar.tsx              # Stats display bar
    setup-notice.tsx                 # Setup instructions banner
  ui/                                # shadcn/ui components

lib/
  db/
    client.ts                        # Supabase client initialization
    types.ts                         # All database type definitions
    index.ts                         # Re-exports for convenience
  utils/
    cn.ts                            # Tailwind className utility
    formatters.ts                    # Currency/number formatters
    error-handler.ts                 # Error handling utilities
    task-utils.ts                    # Task management utilities
    index.ts                         # Re-exports for convenience

scripts/                             # SQL migration scripts (run in order)
```

### Import Patterns

The new structure supports clean imports:

```typescript
// Database
import { supabase, type Car, type RepairJob } from "@/lib/db";

// Utilities
import { cn, formatCurrency, formatNumber } from "@/lib/utils";

// Feature components
import { KanbanColumn, AddCarForm, CarDetailsModal } from "@/components/features/kanban";
import { JobEditModal, PaymentModal } from "@/components/features/repair-bay";
import { AddTaskForm, TaskItem } from "@/components/features/tasks";

// Layout components
import { Navbar, QuickStatsBar, SetupNotice } from "@/components/layout";

// UI components
import { Button } from "@/components/ui/button";
```

### Database Schema Notes

- **car_status enum**: 'Acquired' | 'Prep' | 'Showcase' | 'Ready'
- **job_type**: 'customer' (external) | 'dealer' (internal recon)
- **job_status**: 'pending' → 'in_progress' → 'paused' → 'awaiting_payment' → 'done'
- **JSONB fields**: `car_info`, `customer_info` in `repair_jobs` for flexibility
- **Views**: `job_payment_summary` and `job_total_costs` provide calculated fields
- **RLS enabled**: All tables have Row Level Security with "allow all" policies (no auth required)

### Business Logic

**Repair Bay P&L Tracking**:
- Jobs track both `estimated_cost` (shop cost) and `customer_price` (revenue)
- `JobModification` entries add both cost and price
- `AdditionalCost` entries track extra shop expenses
- Profit = (customer_price + modifications_price) - (estimated_cost + modifications_cost + additional_costs)

**Task Management**:
- Tasks are car-specific checklists with priorities (low/medium/high)
- Task counts determine progress indicators on car cards
- Tasks can be added/edited from the car details modal

## Linting & Type Safety

- Project uses TypeScript strict mode
- ESLint configured with comprehensive rules:
  - No explicit `any` types (enforced as error)
  - Unused variables must start with `_`
  - Import ordering with automatic sorting
  - Consistent quotes (double), semicolons required
  - React best practices (self-closing components, etc.)
- Run `npm run lint:fix` to automatically fix violations
- When querying Supabase, use typed selects to infer return types
