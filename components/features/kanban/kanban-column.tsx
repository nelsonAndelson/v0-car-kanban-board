import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import type { CarWithTasks } from "@/lib/db";

import { SortableCarCard } from "./sortable-car-card";

interface KanbanColumnProps {
  title: string;
  status: CarWithTasks["status"];
  cars: CarWithTasks[];
  onUpdate: () => void;
  onCarClick: (car: CarWithTasks) => void; // Add onCarClick prop
}

export function KanbanColumn({
  title,
  status,
  cars,
  onUpdate,
  onCarClick,
}: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: status,
  });

  const carIds = cars.map((car) => car.id);

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[500px] p-3 transition-all duration-200 rounded-lg bg-muted/50 border ${
        isOver ? "bg-blue-50/80 border-blue-200 shadow-md" : "border-gray-200"
      }`}
    >
      <SortableContext items={carIds} strategy={verticalListSortingStrategy}>
        {cars.map((car) => (
          <SortableCarCard
            key={car.id}
            car={car}
            onUpdate={onUpdate}
            onCarClick={onCarClick}
          />
        ))}
      </SortableContext>

      {cars.length === 0 && (
        <div className="text-center text-muted-foreground py-12 border-2 border-dashed border-border rounded-lg bg-card/50 hover:bg-card/80 transition-colors">
          <div className="text-sm font-medium mb-1">
            No cars in {title.toLowerCase()}
          </div>
          <div className="text-xs opacity-75">
            Drag cars here or add new ones
          </div>
        </div>
      )}
    </div>
  );
}
