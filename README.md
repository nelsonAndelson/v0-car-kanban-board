# Car Turnover Kanban Board

A simple, real-time Kanban board for tracking cars through the sales process from acquisition to ready-to-sale.

## Features

- ✅ Four-column Kanban board (Acquired → Prep → Showcase → Ready)
- ✅ Real-time updates across all connected clients
- ✅ Drag-and-drop functionality to move cars between stages
- ✅ Quick-add form for new cars
- ✅ No authentication required
- ✅ Responsive design

## Tech Stack

- **Frontend**: Next.js 14 with React
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime
- **Drag & Drop**: react-beautiful-dnd
- **Styling**: Tailwind CSS + shadcn/ui

## Setup Instructions

### 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings → API to find your project URL and anon key
3. Run the SQL script in \`scripts/01-create-cars-table.sql\` in your Supabase SQL editor

### 2. Environment Variables

Create a \`.env.local\` file in your project root:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

### 3. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 4. Run the Application

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in multiple browser tabs to test real-time functionality.

## Usage

1. **Add a Car**: Click "Add New Car" and fill in the year, make, model, and color
2. **Move Cars**: Drag and drop cars between columns to update their status
3. **Real-time Updates**: Open multiple browser tabs to see changes sync instantly
4. **Track Progress**: View the summary at the bottom showing car counts per stage

## Database Schema

\`\`\`sql
CREATE TYPE car_status AS ENUM ('Acquired', 'Prep', 'Showcase', 'Ready');

CREATE TABLE cars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year INTEGER NOT NULL,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    color TEXT NOT NULL,
    status car_status NOT NULL DEFAULT 'Acquired',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

## Real-time Features

- All connected clients receive instant updates when cars are moved or added
- No page refresh required
- Optimistic updates for smooth user experience
- Automatic fallback to refetch data if real-time update fails

## Deployment

This project is ready to deploy to Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your environment variables in Vercel dashboard
4. Deploy!

## Troubleshooting

- **Cars not loading**: Check your Supabase URL and API key
- **Real-time not working**: Ensure Row Level Security policies are set correctly
- **Drag and drop issues**: Make sure react-beautiful-dnd is properly installed

## Future Enhancements (Phase 2+)

- Add VIN and mileage tracking
- User authentication and permissions
- Car photos and detailed information
- Sales tracking and reporting
- Mobile app support
