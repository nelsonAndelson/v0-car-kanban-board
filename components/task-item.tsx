"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { supabase, Task } from "@/lib/supabase";
import { priorityIcons, priorityColors } from "@/lib/taskUtils"; // Corrected import
import { handleSupabaseError } from "@/lib/error-handler"; // Corrected import
import { Trash2 } from "lucide-react";

interface TaskItemProps {
  task: Task;
  onTaskUpdate: () => void;
}

export function TaskItem({ task, onTaskUpdate }: TaskItemProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const PriorityIcon = priorityIcons[task.priority];

  const toggleComplete = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          is_completed: !task.is_completed,
          updated_at: new Date().toISOString(),
        })
        .eq("id", task.id);

      if (error) {
        const appError = handleSupabaseError(error);

        if (appError.isTableMissing) {
          alert(
            "Tasks table not found. Please run the SQL script to create the database tables."
          );
          return;
        }

        alert(`Failed to update task: ${appError.message}`);
        return;
      }

      onTaskUpdate();
    } catch (error) {
      console.error("Unexpected error updating task:", error);
      const appError = handleSupabaseError(error);
      alert(`Failed to update task: ${appError.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteTask = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", task.id);

      if (error) {
        const appError = handleSupabaseError(error);

        if (appError.isTableMissing) {
          alert(
            "Tasks table not found. Please run the SQL script to create the database tables."
          );
          return;
        }

        alert(`Failed to delete task: ${appError.message}`);
        return;
      }

      onTaskUpdate();
    } catch (error) {
      console.error("Unexpected error deleting task:", error);
      const appError = handleSupabaseError(error);
      alert(`Failed to delete task: ${appError.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 p-2 rounded border text-xs",
        task.is_completed ? "bg-muted/50 opacity-60" : "bg-background"
      )}
    >
      <Checkbox
        checked={task.is_completed}
        onCheckedChange={toggleComplete}
        disabled={isUpdating}
        className="h-3 w-3"
      />

      <PriorityIcon className={cn("h-3 w-3", priorityColors[task.priority])} />

      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "font-medium truncate",
            task.is_completed && "line-through"
          )}
        >
          {task.title}
        </div>
        {task.description && (
          <div className="text-muted-foreground truncate">
            {task.description}
          </div>
        )}
      </div>

      <Badge
        variant={
          task.priority === "high"
            ? "destructive"
            : task.priority === "medium"
            ? "default"
            : "secondary"
        }
        className="text-xs px-1 py-0"
      >
        {task.priority}
      </Badge>

      <Button
        variant="ghost"
        size="sm"
        onClick={deleteTask}
        disabled={isUpdating}
        className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}
