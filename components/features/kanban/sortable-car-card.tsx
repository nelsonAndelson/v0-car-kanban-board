"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { CarWithTasks } from "@/lib/db";

import { CarCard } from "./car-card";

interface SortableCarCardProps {
  car: CarWithTasks;
  onUpdate: () => void;
  onCarClick: (car: CarWithTasks) => void;
}

export function SortableCarCard({
  car,
  onUpdate,
  onCarClick,
}: SortableCarCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: car.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`mb-3 transition-transform ${
        isDragging
          ? "rotate-1 scale-105 shadow-xl z-50 opacity-50"
          : "hover:shadow-md"
      }`}
    >
      <CarCard car={car} onUpdate={onUpdate} onCarClick={onCarClick} />
    </div>
  );
}
