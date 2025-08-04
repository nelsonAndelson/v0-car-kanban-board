"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { handleSupabaseError } from "@/lib/error-handler"
import { Plus, X } from "lucide-react"

interface AddTaskFormProps {
  carId: string
  onTaskAdded: () => void
}

export function AddTaskForm({ carId, onTaskAdded }: AddTaskFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.from("tasks").insert([
        {
          car_id: carId,
          title: formData.title,
          description: formData.description || null,
          priority: formData.priority,
        },
      ])

      if (error) {
        const appError = handleSupabaseError(error)

        if (appError.isTableMissing) {
          alert("Tasks table not found. Please run the SQL script to create the database tables.")
          return
        }

        alert(`Failed to add task: ${appError.message}`)
        return
      }

      // Reset form
      setFormData({ title: "", description: "", priority: "medium" })
      setIsOpen(false)
      onTaskAdded()
    } catch (error) {
      console.error("Unexpected error adding task:", error)
      const appError = handleSupabaseError(error)
      alert(`Failed to add task: ${appError.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const quickTasks = [
    "Needs oil change",
    "Needs detail",
    "Needs alternator",
    "Needs brake pads",
    "Needs tire rotation",
    "Needs inspection",
    "Needs battery",
    "Needs transmission service",
  ]

  const addQuickTask = async (taskTitle: string) => {
    setIsLoading(true)
    try {
      const { error } = await supabase.from("tasks").insert([
        {
          car_id: carId,
          title: taskTitle,
          priority: "medium",
        },
      ])

      if (error) {
        const appError = handleSupabaseError(error)

        if (appError.isTableMissing) {
          alert("Tasks table not found. Please run the SQL script to create the database tables.")
          return
        }

        alert(`Failed to add task: ${appError.message}`)
        return
      }

      onTaskAdded()
    } catch (error) {
      console.error("Unexpected error adding quick task:", error)
      const appError = handleSupabaseError(error)
      alert(`Failed to add task: ${appError.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <div className="space-y-2">
        <Button onClick={() => setIsOpen(true)} size="sm" variant="outline" className="w-full h-7 text-xs bg-primary">
          <Plus className="w-3 h-3 mr-1" />
          Add Task 
        </Button>

        <div className="grid grid-cols-2 gap-1">
          {quickTasks.slice(0, 4).map((task) => (
            <Button
              key={task}
              onClick={() => addQuickTask(task)}
              disabled={isLoading}
              size="sm"
              variant="ghost"
              className="h-6 text-xs p-1 hover:bg-primary hover:font-bold"
              title={task} // Added title for hover text
            >
              {task.replace("Needs ", "")}
            </Button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Card className="mt-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Add Task Preview</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="h-6 w-6 p-0">
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="title" className="text-xs">
              Task
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="e.g., Needs alternator"
              className="h-8 text-xs"
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-xs">
              Notes (optional)
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Additional details..."
              className="h-16 text-xs resize-none"
            />
          </div>

          <div>
            <Label htmlFor="priority" className="text-xs">
              Priority
            </Label>
            <Select
              value={formData.priority}
              onValueChange={(value: "low" | "medium" | "high") => setFormData({ ...formData, priority: value })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" type="submit" disabled={isLoading} size="sm" className="text-xs">
              {isLoading ? "Adding..." : "Add Task"}
            </Button>
            <Button type="button" variant="destructive" onClick={() => setIsOpen(false)} size="sm" className="text-xs">
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
