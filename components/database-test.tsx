"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { Database, CheckCircle2, XCircle, AlertTriangle } from "lucide-react"

interface TestResult {
  test: string
  status: "success" | "error" | "warning"
  message: string
  details?: any
}

export function DatabaseTest() {
  const [results, setResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const addResult = (result: TestResult) => {
    setResults((prev) => [...prev, result])
  }

  const runTests = async () => {
    setIsRunning(true)
    setResults([])

    // Test 1: Check if we can connect to Supabase
    try {
      const { data, error } = await supabase.from("cars").select("count", { count: "exact", head: true })
      if (error) throw error
      addResult({
        test: "Supabase Connection",
        status: "success",
        message: `Connected successfully. Found ${data} cars.`,
      })
    } catch (error) {
      addResult({
        test: "Supabase Connection",
        status: "error",
        message: "Failed to connect to Supabase",
        details: error,
      })
    }

    // Test 2: Check cars table access
    try {
      const { data, error } = await supabase.from("cars").select("id, year, make, model").limit(5)
      if (error) throw error
      addResult({
        test: "Cars Table Access",
        status: "success",
        message: `Successfully read ${data?.length || 0} cars`,
        details: data,
      })
    } catch (error) {
      addResult({
        test: "Cars Table Access",
        status: "error",
        message: "Failed to read cars table",
        details: error,
      })
    }

    // Test 3: Check tasks table access
    try {
      const { data, error } = await supabase.from("tasks").select("id, title, car_id").limit(5)
      if (error) throw error
      addResult({
        test: "Tasks Table Access",
        status: "success",
        message: `Successfully read ${data?.length || 0} tasks`,
        details: data,
      })
    } catch (error) {
      addResult({
        test: "Tasks Table Access",
        status: "error",
        message: "Failed to read tasks table",
        details: error,
      })
    }

    // Test 4: Try to insert a test task (if we have cars)
    try {
      const { data: cars, error: carsError } = await supabase.from("cars").select("id").limit(1)
      if (carsError) throw carsError

      if (cars && cars.length > 0) {
        const testCarId = cars[0].id
        const { data, error } = await supabase
          .from("tasks")
          .insert([
            {
              car_id: testCarId,
              title: "TEST TASK - DELETE ME",
              priority: "low",
            },
          ])
          .select()

        if (error) throw error

        addResult({
          test: "Task Insert Test",
          status: "success",
          message: "Successfully inserted test task",
          details: data,
        })

        // Clean up - delete the test task
        if (data && data[0]) {
          await supabase.from("tasks").delete().eq("id", data[0].id)
        }
      } else {
        addResult({
          test: "Task Insert Test",
          status: "warning",
          message: "No cars available to test task insertion",
        })
      }
    } catch (error) {
      addResult({
        test: "Task Insert Test",
        status: "error",
        message: "Failed to insert test task",
        details: error,
      })
    }

    // Test 5: Check RLS policies
    try {
      const { data, error } = await supabase.rpc("has_table_privilege", {
        table_name: "tasks",
        privilege: "INSERT",
      })
      if (error) throw error
      addResult({
        test: "RLS Policy Check",
        status: data ? "success" : "warning",
        message: data ? "INSERT privilege confirmed" : "INSERT privilege not confirmed",
        details: data,
      })
    } catch (error) {
      addResult({
        test: "RLS Policy Check",
        status: "warning",
        message: "Could not check RLS policies (this is normal)",
        details: error,
      })
    }

    setIsRunning(false)
  }

  const getIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Database Connectivity Test
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={runTests} disabled={isRunning} className="mb-4">
          {isRunning ? "Running Tests..." : "Run Database Tests"}
        </Button>

        <div className="space-y-3">
          {results.map((result, index) => (
            <div key={index} className="border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                {getIcon(result.status)}
                <span className="font-medium">{result.test}</span>
              </div>
              <div className="text-sm text-muted-foreground mb-2">{result.message}</div>
              {result.details && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-blue-600 hover:text-blue-800">Show Details</summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded overflow-x-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
