'use client';

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  defaultDropAnimationSideEffects,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useMemo, useState } from 'react';
import { RATING_PROVIDER_OPTIONS, type RatingPreference } from '@/lib/ratingPreferences';
import type { RatingProviderRow } from '@/lib/ratingRows';

export type RatingProviderSortableListProps = {
  rows: RatingProviderRow[];
  onReorder: (fromIndex: number, toIndex: number) => void;
  onToggle: (providerId: RatingPreference) => void;
  fillDirection?: 'row' | 'column';
};

const DROP_ANIMATION = {
  duration: 220,
  easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: { opacity: '0.35' },
    },
  }),
};

function SortableRatingProviderRow({
  row,
  position,
  onToggle,
}: {
  row: RatingProviderRow;
  position: number;
  onToggle: (providerId: RatingPreference) => void;
}) {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: row.id,
    transition: {
      duration: 220,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  });

  const providerMeta = RATING_PROVIDER_OPTIONS.find((provider) => provider.id === row.id);

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`flex min-w-0 items-center gap-1.5 rounded-xl border px-2 py-2 text-[11px] transition-shadow ${
        row.enabled
          ? 'border-violet-500/45 bg-zinc-800/85 text-white'
          : 'border-white/10 bg-zinc-950/80 text-zinc-400'
      } ${isDragging ? 'z-10 opacity-25 ring-1 ring-violet-400/30' : 'opacity-100'}`}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Drag to reorder ${providerMeta?.label ?? row.id}`}
        className="shrink-0 cursor-grab rounded-md p-1 text-zinc-500 transition-colors hover:text-violet-300 active:cursor-grabbing"
        style={{ touchAction: 'none' }}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 select-none">
        <input
          type="checkbox"
          checked={row.enabled}
          onChange={() => onToggle(row.id)}
          className="h-3 w-3 shrink-0 accent-violet-500"
        />
        <span className="truncate">{providerMeta?.label ?? row.id}</span>
      </label>
      <span
        className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${
          row.enabled
            ? 'border-violet-400/40 bg-violet-500/10 text-violet-100'
            : 'border-white/10 bg-white/[0.03] text-zinc-500'
        }`}
        aria-label={`Position ${position}`}
      >
        {position}
      </span>
    </li>
  );
}

function DragPreview({ row }: { row: RatingProviderRow }) {
  const providerMeta = RATING_PROVIDER_OPTIONS.find((provider) => provider.id === row.id);

  return (
    <div
      className={`pointer-events-none flex min-w-[148px] max-w-[min(100vw-2rem,300px)] items-center gap-2 rounded-xl border px-2.5 py-2 shadow-[0_22px_50px_-12px_rgba(0,0,0,0.65)] ring-2 ring-violet-500/35 ${
        row.enabled
          ? 'border-violet-400/55 bg-zinc-900/95 text-white'
          : 'border-white/20 bg-zinc-950/95 text-zinc-300'
      }`}
    >
      <GripVertical className="h-4 w-4 shrink-0 text-violet-300" />
      <span className="truncate text-xs font-medium">{providerMeta?.label ?? row.id}</span>
    </div>
  );
}

export function RatingProviderSortableList({
  rows,
  onReorder,
  onToggle,
  fillDirection = 'row',
}: RatingProviderSortableListProps) {
  const [activeId, setActiveId] = useState<RatingPreference | null>(null);
  const itemIds = useMemo(() => rows.map((row) => row.id), [rows]);
  const rowCount = Math.max(1, Math.ceil(rows.length / 2));
  const listStyle =
    fillDirection === 'column'
      ? ({
          gridAutoFlow: 'column',
          gridTemplateRows: `repeat(${rowCount}, auto)`,
        } as const)
      : undefined;
  const overlayRoot = typeof document === 'undefined' ? null : document.body;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeRow = activeId ? rows.find((row) => row.id === activeId) ?? null : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as RatingPreference);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const fromIndex = rows.findIndex((row) => row.id === active.id);
    const toIndex = rows.findIndex((row) => row.id === over.id);
    if (fromIndex < 0 || toIndex < 0) {
      return;
    }

    onReorder(fromIndex, toIndex);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <SortableContext items={itemIds} strategy={rectSortingStrategy}>
        <ul
          className="grid max-h-[min(24rem,55vh)] grid-cols-1 gap-x-3 gap-y-2 overflow-y-auto pr-0.5 sm:grid-cols-2 [touch-action:pan-y]"
          style={listStyle}
        >
          {rows.map((row, index) => (
            <SortableRatingProviderRow
              key={row.id}
              row={row}
              position={index + 1}
              onToggle={onToggle}
            />
          ))}
        </ul>
      </SortableContext>
      {overlayRoot
        ? createPortal(
            <DragOverlay dropAnimation={DROP_ANIMATION} zIndex={9999}>
              {activeRow ? <DragPreview row={activeRow} /> : null}
            </DragOverlay>,
            overlayRoot
          )
        : null}
    </DndContext>
  );
}
