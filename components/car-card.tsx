"use client";

import type { CarWithTasks } from "@/lib/supabase";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskItem } from "./task-item";
import { AddTaskForm } from "./add-task-form";
import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";

interface CarCardProps {
  car: CarWithTasks;
  onUpdate: () => void;
  onCarClick: (car: CarWithTasks) => void; // Add onCarClick prop
}

export function CarCard({ car, onUpdate, onCarClick }: CarCardProps) {
  const completedTasks = car.tasks?.filter((task) => task.is_completed) || [];
  const pendingTasks = car.tasks?.filter((task) => !task.is_completed) || [];
  const highPriorityTasks = pendingTasks.filter(
    (task) => task.priority === "high"
  );

  return (
    <Card
      className="cursor-grab active:cursor-grabbing hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary bg-card hover:bg-accent/50 shadow-sm"
      onClick={() => onCarClick(car)} // Make the card clickable
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="font-semibold text-sm text-gray-900 mb-1">
              {car.year} {car.make} {car.model}
            </div>
            <div className="text-xs text-muted-foreground font-medium">
              ({car.color})
            </div>
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            {highPriorityTasks.length > 0 && (
              <Badge
                variant="destructive"
                className="text-xs px-2 py-1 font-medium"
              >
                <AlertTriangle className="w-3 h-3 mr-1" />
                {highPriorityTasks.length}
              </Badge>
            )}

            {pendingTasks.length > 0 && (
              <Badge
                variant="secondary"
                className="text-xs px-2 py-1 font-medium"
              >
                <Clock className="w-3 h-3 mr-1" />
                {pendingTasks.length}
              </Badge>
            )}

            {completedTasks.length > 0 && (
              <Badge
                variant="default"
                className="text-xs px-2 py-1 font-medium bg-green-100 text-green-800 hover:bg-green-200"
              >
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {completedTasks.length}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Pending Tasks */}
        {pendingTasks.length > 0 && (
          <div className="space-y-1 mb-3">
            {pendingTasks.slice(0, 3).map((task) => (
              <TaskItem key={task.id} task={task} onTaskUpdate={onUpdate} />
            ))}
            {pendingTasks.length > 3 && (
              <div className="text-xs text-muted-foreground text-center py-1">
                +{pendingTasks.length - 3} more tasks
              </div>
            )}
          </div>
        )}

        {/* Completed Tasks (collapsed) */}
        {completedTasks.length > 0 && (
          <div className="mb-3">
            <details className="group">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                {completedTasks.length} completed task
                {completedTasks.length !== 1 ? "s" : ""}
              </summary>
              <div className="mt-2 space-y-1">
                {completedTasks.map((task) => (
                  <TaskItem key={task.id} task={task} onTaskUpdate={onUpdate} />
                ))}
              </div>
            </details>
          </div>
        )}

        {/* Add Task Form */}
        <AddTaskForm carId={car.id} onTaskAdded={onUpdate} />
      </CardContent>
    </Card>
  );
}
