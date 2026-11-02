"use client";

import type { ReactNode } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableListProps {
  ids: string[];
  /** Pindahkan item dari indeks `from` ke `to`. */
  onMove: (from: number, to: number) => void;
  /** Nama item untuk label handle & pengumuman pembaca layar, mis. "Pengalaman 2". */
  itemLabel: (id: string, index: number) => string;
  /** Render item; `handle` = tombol seret yang ditaruh di dalam item. */
  children: (id: string, index: number, handle: ReactNode) => ReactNode;
  className?: string;
}

/**
 * Daftar yang bisa diurutkan dengan seret (mouse/sentuh) dan keyboard
 * (fokus handle → spasi → panah atas/bawah → spasi). Dipakai modal urutan
 * section dan kartu entri di form.
 */
export function SortableList({ ids, onMove, itemLabel, children, className }: SortableListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    // Sentuh: tahan sebentar supaya scroll halaman tidak dikira seret.
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const nameOf = (id: string | number) => {
    const i = ids.indexOf(String(id));
    return i < 0 ? "Item" : itemLabel(String(id), i);
  };
  const posOf = (id: string | number) => ids.indexOf(String(id)) + 1;

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const from = ids.indexOf(String(e.active.id));
    const to = ids.indexOf(String(e.over.id));
    if (from >= 0 && to >= 0) onMove(from, to);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      accessibility={{
        screenReaderInstructions: {
          draggable: "Tekan spasi atau Enter untuk mengangkat, panah atas/bawah untuk memindah, spasi lagi untuk meletakkan, Escape untuk batal.",
        },
        announcements: {
          onDragStart: ({ active }) => `${nameOf(active.id)} diangkat.`,
          onDragOver: ({ active, over }) =>
            over ? `${nameOf(active.id)} di posisi ${posOf(over.id)} dari ${ids.length}.` : `${nameOf(active.id)} di luar daftar.`,
          onDragEnd: ({ active, over }) =>
            over ? `${nameOf(active.id)} diletakkan di posisi ${posOf(over.id)} dari ${ids.length}.` : `${nameOf(active.id)} dilepas.`,
          onDragCancel: ({ active }) => `Pemindahan ${nameOf(active.id)} dibatalkan.`,
        },
      }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className={className}>
          {ids.map((id, i) => (
            <SortableItem key={id} id={id} label={itemLabel(id, i)}>
              {(handle) => children(id, i, handle)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableItem({ id, label, children }: { id: string; label: string; children: (handle: ReactNode) => ReactNode }) {
  // roleDescription dnd-kit bawaan ("sortable") diganti deskripsi yang benar untuk tombol pegangan.
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id,
    attributes: { roleDescription: "pegangan seret" },
  });
  const handle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label={`Seret ${label}`}
      className="inline-flex h-11 w-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:cursor-grabbing sm:h-9"
    >
      <span className="material-symbols-outlined text-[20px]" aria-hidden="true">drag_indicator</span>
    </button>
  );
  return (
    <div
      ref={setNodeRef}
      data-sortable-id={id}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={isDragging ? "relative z-10 opacity-90 shadow-soft rounded-xl" : undefined}
    >
      {children(handle)}
    </div>
  );
}
