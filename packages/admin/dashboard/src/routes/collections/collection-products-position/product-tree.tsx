import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { DotsSix } from "@medusajs/icons"
import { Text } from "@medusajs/ui"
import React, { useState } from "react"

type ProductTreeProps<T> = {
  value: T[]
  onChange: (
    value: {
      id: string
      index: number
    },
    arr: T[]
  ) => void
  renderValue: (item: T) => string
}

export const ProductTree = <T extends { id: string }>({
  value,
  onChange,
  renderValue,
}: ProductTreeProps<T>) => {
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = value.findIndex((item) => item.id === active.id)
      const newIndex = value.findIndex((item) => item.id === over.id)

      const newValue = arrayMove(value, oldIndex, newIndex)

      onChange(
        {
          id: active.id as string,
          index: newIndex,
        },
        newValue
      )
    }

    setActiveId(null)
  }

  const activeItem = activeId
    ? value.find((item) => item.id === activeId)
    : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={value} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-y-2 p-4">
          {value.map((item) => (
            <SortableItem key={item.id} id={item.id}>
              <div className="border-ui-border-base bg-ui-bg-base flex items-center gap-x-2 rounded-md border p-2">
                <DotsSix className="text-ui-fg-subtle" />
                <Text>{renderValue(item)}</Text>
              </div>
            </SortableItem>
          ))}
        </div>
      </SortableContext>
      <DragOverlay>
        {activeItem ? (
          <div className="border-ui-border-base bg-ui-bg-base flex items-center gap-x-2 rounded-md border p-2">
            <DotsSix className="text-ui-fg-subtle" />
            <Text>{renderValue(activeItem)}</Text>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

const SortableItem = ({
  id,
  children,
}: {
  id: string
  children: React.ReactNode
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  )
}
