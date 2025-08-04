import type { CarWithTasks } from "@/lib/supabase"
import { CarCard } from "./car-card"
import { Droppable, Draggable } from "react-beautiful-dnd"

interface KanbanColumnProps {
  title: string
  status: CarWithTasks["status"]
  cars: CarWithTasks[]
  onUpdate: () => void
  onCarClick: (car: CarWithTasks) => void // Add onCarClick prop
}

export function KanbanColumn({ title, status, cars, onUpdate, onCarClick }: KanbanColumnProps) {
  return (
    <Droppable droppableId={status}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`min-h-[400px] transition-colors rounded-lg ${snapshot.isDraggingOver ? "bg-muted/50" : ""}`}
        >
          {cars.map((car, index) => (
            <Draggable key={car.id} draggableId={car.id} index={index}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  className={`transition-transform ${snapshot.isDragging ? "rotate-1 scale-105 shadow-xl" : ""}`}
                >
                  <CarCard car={car} onUpdate={onUpdate} onCarClick={onCarClick} /> {/* Pass onCarClick */}
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}

          {cars.length === 0 && (
            <div className="text-center text-muted-foreground py-8 border-2 border-dashed border-muted rounded-lg">
              <div className="text-sm">No cars in {title.toLowerCase()}</div>
              <div className="text-xs mt-1">Drag cars here or add new ones</div>
            </div>
          )}
        </div>
      )}
    </Droppable>
  )
}
