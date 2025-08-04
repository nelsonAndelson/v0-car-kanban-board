-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for car status
DO $$ BEGIN
    CREATE TYPE car_status AS ENUM ('Acquired', 'Prep', 'Showcase', 'Ready');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create cars table
CREATE TABLE IF NOT EXISTS cars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year INTEGER NOT NULL,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    color TEXT NOT NULL,
    status car_status NOT NULL DEFAULT 'Acquired',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cars_status ON cars(status);
CREATE INDEX IF NOT EXISTS idx_cars_updated_at ON cars(updated_at);
CREATE INDEX IF NOT EXISTS idx_tasks_car_id ON tasks(car_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(is_completed);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

-- Enable Row Level Security
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations on cars" ON cars;
DROP POLICY IF EXISTS "Allow all operations on tasks" ON tasks;

-- Create policies to allow all operations (since no auth required)
CREATE POLICY "Allow all operations on cars" ON cars FOR ALL USING (true);
CREATE POLICY "Allow all operations on tasks" ON tasks FOR ALL USING (true);

-- Add some sample data (only if tables are empty)
INSERT INTO cars (year, make, model, color, status) 
SELECT 2020, 'Toyota', 'Camry', 'Silver', 'Acquired'
WHERE NOT EXISTS (SELECT 1 FROM cars LIMIT 1);

INSERT INTO cars (year, make, model, color, status) 
SELECT 2019, 'Honda', 'Civic', 'Blue', 'Prep'
WHERE NOT EXISTS (SELECT 1 FROM cars WHERE make = 'Honda' AND model = 'Civic');

INSERT INTO cars (year, make, model, color, status) 
SELECT 2021, 'Ford', 'F-150', 'Black', 'Showcase'
WHERE NOT EXISTS (SELECT 1 FROM cars WHERE make = 'Ford' AND model = 'F-150');
