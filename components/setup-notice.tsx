"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Database, AlertTriangle, CheckCircle2, Copy } from "lucide-react"
import { supabase } from "@/lib/supabase"

export function SetupNotice() {
  const [isVisible, setIsVisible] = useState(false)
  const [tablesExist, setTablesExist] = useState({ cars: false, tasks: false })
  const [isChecking, setIsChecking] = useState(true)

  const checkTables = async () => {
    setIsChecking(true)
    try {
      // Check if cars table exists
      const { error: carsError } = await supabase.from("cars").select("id").limit(1)
      const carsExist = !carsError || !carsError.message.includes("does not exist")

      // Check if tasks table exists
      const { error: tasksError } = await supabase.from("tasks").select("id").limit(1)
      const tasksExist = !tasksError || !tasksError.message.includes("does not exist")

      setTablesExist({ cars: carsExist, tasks: tasksExist })

      // Show notice if either table is missing
      setIsVisible(!carsExist || !tasksExist)
    } catch (error) {
      console.error("Error checking tables:", error)
      setIsVisible(true)
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    checkTables()
  }, [])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const sqlScript = `-- Enable UUID extension if not already enabled
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
CREATE POLICY "Allow all operations on tasks" ON tasks FOR ALL USING (true);`

  if (isChecking) {
    return (
      <Alert className="mb-6">
        <Database className="h-4 w-4" />
        <AlertDescription>Checking database setup...</AlertDescription>
      </Alert>
    )
  }

  if (!isVisible) {
    return null
  }

  return (
    <Card className="mb-6 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertTriangle className="w-5 h-5" />
          Database Setup Required
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {tablesExist.cars ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-orange-500" />
            )}
            <span className={tablesExist.cars ? "text-green-700" : "text-orange-700"}>
              Cars table {tablesExist.cars ? "exists" : "missing"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {tablesExist.tasks ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-orange-500" />
            )}
            <span className={tablesExist.tasks ? "text-green-700" : "text-orange-700"}>
              Tasks table {tablesExist.tasks ? "exists" : "missing"}
            </span>
          </div>
        </div>

        <Alert>
          <AlertDescription>
            <strong>Setup Instructions:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Go to your Supabase project dashboard</li>
              <li>Navigate to the SQL Editor</li>
              <li>Copy and paste the SQL script below</li>
              <li>Click "Run" to create the required tables</li>
              <li>Refresh this page</li>
            </ol>
          </AlertDescription>
        </Alert>

        <div className="relative">
          <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto max-h-64 overflow-y-auto">
            <code>{sqlScript}</code>
          </pre>
          <Button
            variant="outline"
            size="sm"
            className="absolute top-2 right-2 bg-transparent"
            onClick={() => copyToClipboard(sqlScript)}
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Button onClick={checkTables} variant="outline">
            Check Again
          </Button>
          <Button onClick={() => setIsVisible(false)} variant="ghost">
            Dismiss
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
