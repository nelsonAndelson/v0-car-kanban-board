"use client";

import { useState } from "react";

import {
  X,
  Car,
  Calendar,
  Palette,
  Tag,
  Info,
  Clock,
  Trash2,
} from "lucide-react";

import { AddTaskForm } from "@/components/features/tasks/add-task-form";
import { TaskItem } from "@/components/features/tasks/task-item";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CarWithTasks } from "@/lib/db";
import { supabase } from "@/lib/db";
import { handleSupabaseError } from "@/lib/utils/error-handler";

interface CarDetailsModalProps {
  car: CarWithTasks;
  onClose: () => void;
  onUpdate: () => void; // To trigger re-fetch after task changes
}

export function CarDetailsModal({
  car,
  onClose,
  onUpdate,
}: CarDetailsModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const completedTasks = car.tasks?.filter((task) => task.is_completed) || [];
  const pendingTasks = car.tasks?.filter((task) => !task.is_completed) || [];

  const handleDeleteCar = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.from("cars").delete().eq("id", car.id);

      if (error) {
        const appError = handleSupabaseError(error);
        alert(`Failed to delete car: ${appError.message}`);
        return;
      }

      // Close the modal and trigger a full data refresh
      onClose(); // This will also call onUpdate from app/page.tsx
    } catch (error) {
      console.error("Unexpected error deleting car:", error);
      const appError = handleSupabaseError(error);
      alert(`Failed to delete car: ${appError.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <Card className="relative w-full max-w-3xl max-h-[90vh] flex flex-col border-2 border-primary/20 shadow-2xl bg-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Car className="w-6 h-6" />
              {car.year} {car.make} {car.model}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Badge variant="secondary">{car.status}</Badge>
            <span className="text-xs">
              Last updated: {new Date(car.updated_at).toLocaleString()}
            </span>
          </div>
        </CardHeader>

        {/* Scrollable Content Area */}
        <CardContent className="flex-grow overflow-y-auto space-y-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <strong>Year:</strong> {car.year}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <strong>Make:</strong> {car.make}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Info className="w-4 h-4 text-muted-foreground" />
              <strong>Model:</strong> {car.model}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Palette className="w-4 h-4 text-muted-foreground" />
              <strong>Color:</strong> {car.color}
            </div>
          </div>

          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Tasks ({pendingTasks.length} Pending, {completedTasks.length}{" "}
            Completed)
          </h3>
          <div className="space-y-3">
            {pendingTasks.length === 0 && completedTasks.length === 0 && (
              <div className="text-muted-foreground text-sm text-center py-4 border-dashed border-2 rounded-lg">
                No tasks for this car yet.
              </div>
            )}

            {pendingTasks.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">
                  Pending:
                </h4>
                {pendingTasks.map((task) => (
                  <TaskItem key={task.id} task={task} onTaskUpdate={onUpdate} />
                ))}
              </div>
            )}

            {completedTasks.length > 0 && (
              <details className="group">
                <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground font-medium">
                  {completedTasks.length} Completed Task
                  {completedTasks.length !== 1 ? "s" : ""}
                </summary>
                <div className="mt-2 space-y-2">
                  {completedTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onTaskUpdate={onUpdate}
                    />
                  ))}
                </div>
              </details>
            )}
          </div>

          <AddTaskForm carId={car.id} onTaskAdded={onUpdate} />
        </CardContent>

        {/* Fixed Footer for Delete Button */}
        <div className="pt-4 border-t mt-6 flex justify-end p-6 bg-black">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? "Deleting..." : "Delete Car"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the{" "}
                  <strong>
                    {car.year} {car.make} {car.model} ({car.color})
                  </strong>{" "}
                  and all its associated tasks from the database.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteCar}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Card>
    </div>
  );
}
