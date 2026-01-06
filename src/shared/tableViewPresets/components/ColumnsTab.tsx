import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Button } from '@/shared/components/ui/button';
import { getDefaultState } from '../utils/columnState';
import type { ColumnState } from '../types/tableViewPresets.types';
import type { ColumnDefinition } from '../config/defaultColumns';

interface ColumnsTabProps {
  columnState: ColumnState;
  onColumnStateChange: (state: ColumnState) => void;
  availableColumns: ColumnDefinition[];
  module: 'orders' | 'invoices';
}

interface SortableColumnItemProps {
  column: ColumnDefinition;
  isVisible: boolean;
  onToggleVisibility: (columnId: string) => void;
}

const SortableColumnItem: React.FC<SortableColumnItemProps> = ({
  column,
  isVisible,
  onToggleVisibility,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-2 border rounded-md bg-background hover:bg-muted/50"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      <Checkbox
        checked={isVisible}
        onCheckedChange={() => onToggleVisibility(column.id)}
        id={`column-${column.id}`}
      />
      <label
        htmlFor={`column-${column.id}`}
        className="flex-1 cursor-pointer text-sm font-medium"
      >
        {column.label || column.id}
      </label>
      <span className="text-xs text-muted-foreground">
        {column.defaultWidth}px
      </span>
    </div>
  );
};

export const ColumnsTab: React.FC<ColumnsTabProps> = ({
  columnState,
  onColumnStateChange,
  availableColumns,
  module,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get columns in current order, filtered by visibility
  const orderedColumns = availableColumns
    .filter(col => columnState.visibility[col.id] !== false)
    .sort((a, b) => {
      const aIndex = columnState.order.indexOf(a.id);
      const bIndex = columnState.order.indexOf(b.id);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

  // Include all columns (visible and hidden) for drag-and-drop
  const allOrderedColumns = availableColumns.sort((a, b) => {
    const aIndex = columnState.order.indexOf(a.id);
    const bIndex = columnState.order.indexOf(b.id);
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = allOrderedColumns.findIndex(col => col.id === active.id);
      const newIndex = allOrderedColumns.findIndex(col => col.id === over.id);

      const newOrder = arrayMove(
        columnState.order,
        oldIndex,
        newIndex
      );

      onColumnStateChange({
        ...columnState,
        order: newOrder,
      });
    }
  };

  const handleToggleVisibility = (columnId: string) => {
    onColumnStateChange({
      ...columnState,
      visibility: {
        ...columnState.visibility,
        [columnId]: !columnState.visibility[columnId],
      },
    });
  };

  const handleResetToDefault = () => {
    const defaultState = getDefaultState(module);
    onColumnStateChange(defaultState);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Drag to reorder columns. Toggle visibility with checkboxes.
        </p>
        <Button variant="outline" size="sm" onClick={handleResetToDefault}>
          Reset to Default
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={allOrderedColumns.map(col => col.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {allOrderedColumns.map(column => (
              <SortableColumnItem
                key={column.id}
                column={column}
                isVisible={columnState.visibility[column.id] !== false}
                onToggleVisibility={handleToggleVisibility}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

