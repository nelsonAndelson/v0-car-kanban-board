"use client";

import { Button } from "@/components/ui/button";

import { useState, useEffect } from "react";
import { DragDropContext, type DropResult } from "react-beautiful-dnd";
import { supabase, type CarWithTasks } from "@/lib/supabase";
import { KanbanColumn } from "@/components/kanban-column";
import { AddCarForm } from "@/components/add-car-form";
import { Badge } from "@/components/ui/badge";
import { Car, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { FloatingAddButton } from "@/components/floating-add-button";
import { QuickStatsBar } from "@/components/quick-stats-bar";
import { SetupNotice } from "@/components/setup-notice";
import { DatabaseTest } from "@/components/database-test";
import { CarDetailsModal } from "@/components/car-details-modal";

const COLUMNS = [
  { id: "Acquired", title: "Acquired", color: "bg-blue-100 border-blue-200" },
  { id: "Prep", title: "In Prep", color: "bg-yellow-100 border-yellow-200" },
  {
    id: "Showcase",
    title: "Showcase",
    color: "bg-purple-100 border-purple-200",
  },
  {
    id: "Ready",
    title: "Ready to Sale",
    color: "bg-green-100 border-green-200",
  },
] as const;

export default function KanbanBoard() {
  const [cars, setCars] = useState<CarWithTasks[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDebug, setShowDebug] = useState(false);
  const [selectedCar, setSelectedCar] = useState<CarWithTasks | null>(null);
  const [isCarDetailsModalOpen, setIsCarDetailsModalOpen] = useState(false);

  // Fetch cars with tasks from Supabase
  const fetchCarsWithTasks = async () => {
    try {
      // First, fetch cars
      const { data: carsData, error: carsError } = await supabase
        .from("cars")
        .select("*")
        .order("updated_at", { ascending: false });

      if (carsError) throw carsError;

      // Try to fetch tasks, but handle gracefully if table doesn't exist
      let tasksData: any[] = [];
      try {
        const { data, error: tasksError } = await supabase
          .from("tasks")
          .select("*")
          .order("created_at", { ascending: true });

        if (tasksError) {
          // If tasks table doesn't exist, log warning but continue
          if (tasksError.message.includes("does not exist")) {
            console.warn(
              "Tasks table not found. Please run the SQL script to create it."
            );
          } else {
            throw tasksError;
          }
        } else {
          tasksData = data || [];
        }
      } catch (taskError) {
        console.warn("Could not fetch tasks:", taskError);
        // Continue with empty tasks array
      }

      // Combine cars with their tasks
      const carsWithTasks: CarWithTasks[] = (carsData || []).map((car) => ({
        ...car,
        tasks: tasksData.filter((task) => task.car_id === car.id),
      }));

      setCars(carsWithTasks);

      // IMPORTANT: If the modal is open, update the selectedCar with the latest data
      if (isCarDetailsModalOpen && selectedCar) {
        const updatedSelectedCar = carsWithTasks.find(
          (car) => car.id === selectedCar.id
        );
        if (updatedSelectedCar) {
          setSelectedCar(updatedSelectedCar);
        }
      }
    } catch (error) {
      console.error("Error fetching cars:", error);
      // Set empty array on error
      setCars([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    fetchCarsWithTasks();

    // Subscribe to cars changes
    const carsSubscription = supabase
      .channel("cars-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cars",
        },
        () => {
          fetchCarsWithTasks();
        }
      )
      .subscribe();

    // Subscribe to tasks changes
    const tasksSubscription = supabase
      .channel("tasks-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
        },
        () => {
          fetchCarsWithTasks();
        }
      )
      .subscribe();

    return () => {
      carsSubscription.unsubscribe();
      tasksSubscription.unsubscribe();
    };
  }, [isCarDetailsModalOpen, selectedCar?.id]); // Re-run effect if modal state or selected car changes

  // Handle drag and drop
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as CarWithTasks["status"];

    try {
      const { error } = await supabase
        .from("cars")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", draggableId);

      if (error) throw error;

      // Optimistically update local state
      setCars((prevCars) =>
        prevCars.map((car) =>
          car.id === draggableId
            ? {
                ...car,
                status: newStatus,
                updated_at: new Date().toISOString(),
              }
            : car
        )
      );
    } catch (error) {
      console.error("Error updating car status:", error);
      fetchCarsWithTasks(); // Revert on error
    }
  };

  // Handle car card click to open modal
  const handleCarClick = (car: CarWithTasks) => {
    setSelectedCar(car);
    setIsCarDetailsModalOpen(true);
  };

  // Close car details modal
  const handleCloseCarDetailsModal = () => {
    setSelectedCar(null);
    setIsCarDetailsModalOpen(false);
    fetchCarsWithTasks(); // Refresh data in case tasks were updated in modal
  };

  // Group cars by status
  const carsByStatus = cars.reduce((acc, car) => {
    if (!acc[car.status]) {
      acc[car.status] = [];
    }
    acc[car.status].push(car);
    return acc;
  }, {} as Record<CarWithTasks["status"], CarWithTasks[]>);

  // Calculate statistics
  const totalTasks = cars.reduce((sum, car) => sum + car.tasks.length, 0);
  const completedTasks = cars.reduce(
    (sum, car) => sum + car.tasks.filter((t) => t.is_completed).length,
    0
  );
  const highPriorityTasks = cars.reduce(
    (sum, car) =>
      sum +
      car.tasks.filter((t) => !t.is_completed && t.priority === "high").length,
    0
  );

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading inventory...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <QuickStatsBar cars={cars} />

      <div className="text-center mb-6 mt-4">
        <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-3">
          <Car className="w-8 h-8" />
          Car Turnover Kanban
        </h1>
        <p className="text-muted-foreground">
          Track your inventory from acquisition to sale
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDebug(!showDebug)}
          className="mt-2"
        >
          {showDebug ? "Hide" : "Show"} Debug Tools
        </Button>
      </div>

      <SetupNotice />

      {showDebug && <DatabaseTest />}

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-lg p-4 border">
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-blue-500" />
            <div>
              <div className="text-2xl font-bold">{cars.length}</div>
              <div className="text-sm text-muted-foreground">Total Cars</div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg p-4 border">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            <div>
              <div className="text-2xl font-bold">
                {totalTasks - completedTasks}
              </div>
              <div className="text-sm text-muted-foreground">Pending Tasks</div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg p-4 border">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <div>
              <div className="text-2xl font-bold">{completedTasks}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg p-4 border">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <div>
              <div className="text-2xl font-bold">{highPriorityTasks}</div>
              <div className="text-sm text-muted-foreground">High Priority</div>
            </div>
          </div>
        </div>
      </div>

      <AddCarForm onCarAdded={fetchCarsWithTasks} />

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex overflow-x-auto pb-4 -mx-6 px-6">
          {" "}
          {/* Horizontal scrolling container */}
          {COLUMNS.map((column) => (
            <div
              key={column.id}
              className={`flex-shrink-0 w-[320px] rounded-lg border-2 ${column.color} p-4 mr-6`}
            >
              {" "}
              {/* Fixed width for columns */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">{column.title}</h3>
                <Badge variant="secondary" className="font-mono">
                  {carsByStatus[column.id]?.length || 0}
                </Badge>
              </div>
              <KanbanColumn
                title={column.title}
                status={column.id}
                cars={carsByStatus[column.id] || []}
                onUpdate={fetchCarsWithTasks}
                onCarClick={handleCarClick} // Pass the click handler
              />
            </div>
          ))}
        </div>
      </DragDropContext>
      <FloatingAddButton onCarAdded={fetchCarsWithTasks} />

      {isCarDetailsModalOpen && selectedCar && (
        <CarDetailsModal
          car={selectedCar}
          onClose={handleCloseCarDetailsModal}
          onUpdate={fetchCarsWithTasks}
        />
      )}
    </div>
  );
}
