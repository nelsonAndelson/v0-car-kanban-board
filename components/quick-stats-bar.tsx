"use client"

import { Badge } from "@/components/ui/badge"
import { Car, Clock, AlertTriangle, TrendingUp } from "lucide-react"
import type { CarWithTasks } from "@/lib/supabase"

interface QuickStatsBarProps {
  cars: CarWithTasks[]
}

export function QuickStatsBar({ cars }: QuickStatsBarProps) {
  const totalTasks = cars.reduce((sum, car) => sum + car.tasks.length, 0)
  const completedTasks = cars.reduce((sum, car) => sum + car.tasks.filter((t) => t.is_completed).length, 0)
  const highPriorityTasks = cars.reduce(
    (sum, car) => sum + car.tasks.filter((t) => !t.is_completed && t.priority === "high").length,
    0,
  )
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="fixed top-4 left-4 right-4 z-20 bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="flex items-center gap-1">
            <Car className="w-3 h-3" />
            {cars.length} Cars
          </Badge>

          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-yellow-500" />
            {totalTasks - completedTasks} Pending
          </Badge>

          {highPriorityTasks > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {highPriorityTasks} High Priority
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800">
            <TrendingUp className="w-3 h-3" />
            {completionRate}% Complete
          </Badge>
        </div>
      </div>
    </div>
  )
}
