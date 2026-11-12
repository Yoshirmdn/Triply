"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { ApiClientError, apiDelete, apiGet, apiPatch } from "@/lib/api-client";
import { ItineraryMap } from "@/components/fragment/itinerary-map";
import { PLACE_CATEGORY_LABELS } from "@/data/places";
import { ROUTE_MODES, ROUTE_MODE_LABELS, type RouteMode } from "@/data/itinerary";
import { cn } from "@/lib/utils";
import { formatDateID } from "@/utils/date";
import { formatDistance, formatDuration } from "@/utils/format";
import type { RouteDTO, RouteLegDTO } from "@/@type/itinerary";
import type { ItineraryItemDTO } from "@/@type/place";
import type { TripDayDTO } from "@/@type/trip";

type Columns = Record<string, ItineraryItemDTO[]>;

type PlannerClientProps = {
  tripId: string;
  days: TripDayDTO[];
  initialItems: ItineraryItemDTO[];
  canEdit: boolean;
};

function groupItems(days: TripDayDTO[], items: ItineraryItemDTO[]): Columns {
  const columns: Columns = {};
  for (const day of days) columns[day.id] = [];
  for (const item of items) columns[item.tripDayId]?.push(item);
  return columns;
}

function signature(columns: Columns) {
  return Object.keys(columns)
    .sort()
    .map((key) => `${key}:${columns[key].map((item) => item.id).join(",")}`)
    .join("|");
}

function DayColumn({ dayId, children }: { dayId: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: dayId });
  return (
    <div ref={setNodeRef} className={cn("min-h-16 space-y-2 rounded-lg p-1 transition", isOver && "bg-teal-50")}>
      {children}
    </div>
  );
}

type SortableItemProps = {
  item: ItineraryItemDTO;
  index: number;
  canEdit: boolean;
  leg: RouteLegDTO | null;
  onUpdate: (item: ItineraryItemDTO) => void;
  onRemove: (itemId: string) => void;
  tripId: string;
};

function SortableItem({ item, index, canEdit, leg, onUpdate, onRemove, tripId }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !canEdit,
  });
  const [editing, setEditing] = useState(false);
  const [startTime, setStartTime] = useState(item.startTime ?? "");
  const [endTime, setEndTime] = useState(item.endTime ?? "");
  const [notes, setNotes] = useState(item.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const updated = await apiPatch<ItineraryItemDTO>(`/trips/${tripId}/itinerary/${item.id}`, {
        startTime: startTime || null,
        endTime: endTime || null,
        notes: notes.trim() || null,
      });
      onUpdate(updated);
      setEditing(false);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Hapus "${item.place?.name ?? "tempat ini"}" dari itinerary?`)) return;
    setSaving(true);
    setError(null);
    try {
      await apiDelete(`/trips/${tripId}/itinerary/${item.id}`);
      onRemove(item.id);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Gagal menghapus");
      setSaving(false);
    }
  }

  const name = item.place?.name ?? item.title ?? "Tanpa nama";

  return (
    <div>
      <div
        ref={setNodeRef}
        style={{ transform: CSS.Transform.toString(transform), transition }}
        className={cn(
          "rounded-lg border border-neutral-200 bg-white p-3",
          isDragging && "relative z-10 opacity-70 shadow-lg",
        )}
      >
        <div className="flex items-start gap-3">
          {canEdit ? (
            <button
              type="button"
              aria-label="Geser untuk mengurutkan"
              className="mt-0.5 cursor-grab touch-none text-neutral-400 hover:text-neutral-700 active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="size-5" />
            </button>
          ) : null}
          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-teal-800 text-xs font-semibold text-white">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="font-medium text-neutral-900">{name}</p>
            <p className="text-xs text-neutral-500">
              {item.place ? PLACE_CATEGORY_LABELS[item.place.category] : "Catatan"}
              {item.startTime ? ` · ${item.startTime}${item.endTime ? `–${item.endTime}` : ""}` : ""}
            </p>
            {item.place?.address ? <p className="line-clamp-1 text-xs text-neutral-500">{item.place.address}</p> : null}
            {item.notes && !editing ? <p className="whitespace-pre-line text-sm text-neutral-600">{item.notes}</p> : null}
          </div>
          {canEdit ? (
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => setEditing((value) => !value)}
                aria-label="Edit"
                className="rounded p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
              >
                <Pencil className="size-4" />
              </button>
              <button
                type="button"
                onClick={remove}
                disabled={saving}
                aria-label="Hapus"
                className="rounded p-1.5 text-neutral-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ) : null}
        </div>

        {editing ? (
          <div className="mt-3 space-y-3 border-t border-neutral-100 pt-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1 text-xs text-neutral-600">
                <span>Mulai</span>
                <input
                  type="time"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
                />
              </label>
              <label className="space-y-1 text-xs text-neutral-600">
                <span>Selesai</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
                />
              </label>
            </div>
            <label className="block space-y-1 text-xs text-neutral-600">
              <span>Catatan</span>
              <textarea
                rows={2}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
              />
            </label>
            {error ? <p className="text-xs text-red-600">{error}</p> : null}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="rounded-lg bg-teal-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-900 disabled:opacity-60"
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        ) : error ? (
          <p className="mt-2 text-xs text-red-600">{error}</p>
        ) : null}
      </div>

      {leg ? (
        <p className="py-1.5 text-center text-xs text-neutral-500">
          ↓ {formatDistance(leg.distance)} · {formatDuration(leg.time)}
        </p>
      ) : null}
    </div>
  );
}

export function PlannerClient({ tripId, days, initialItems, canEdit }: PlannerClientProps) {
  const [columns, setColumns] = useState<Columns>(() => groupItems(days, initialItems));
  const [snapshot, setSnapshot] = useState<Columns | null>(null);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeDayId, setActiveDayId] = useState<string>(() => {
    const firstWithItems = days.find((day) => initialItems.some((item) => item.tripDayId === day.id));
    return (firstWithItems ?? days[0])?.id ?? "";
  });
  const [mode, setMode] = useState<RouteMode>("drive");
  const [route, setRoute] = useState<RouteDTO | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const activeItems = useMemo(() => columns[activeDayId] ?? [], [columns, activeDayId]);
  const routeKey = activeItems.map((item) => item.id).join(",");

  const stops = useMemo(
    () =>
      activeItems.flatMap((item) =>
        item.place
          ? [{ id: item.id, name: item.place.name, latitude: item.place.latitude, longitude: item.place.longitude }]
          : [],
      ),
    [activeItems],
  );

  useEffect(() => {
    if (dragging || saving || !activeDayId || stops.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setRouteLoading(true);
      setRouteError(null);
      apiGet<RouteDTO>(`/trips/${tripId}/route?dayId=${activeDayId}&mode=${mode}`, { signal: controller.signal })
        .then(setRoute)
        .catch((err) => {
          if (controller.signal.aborted) return;
          setRoute(null);
          setRouteError(err instanceof ApiClientError ? err.message : "Gagal memuat rute");
        })
        .finally(() => {
          if (!controller.signal.aborted) setRouteLoading(false);
        });
    }, 500);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [tripId, activeDayId, mode, routeKey, dragging, saving, stops.length]);

  const hasRoute = stops.length >= 2;
  const shownRoute = hasRoute ? route : null;
  const shownRouteError = hasRoute ? routeError : null;
  const shownRouteLoading = hasRoute && routeLoading;

  function findContainer(id: string): string | undefined {
    if (id in columns) return id;
    return Object.keys(columns).find((key) => columns[key].some((item) => item.id === id));
  }

  function handleDragStart() {
    setSnapshot(columns);
    setDragging(true);
    setError(null);
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    const from = findContainer(String(active.id));
    const to = findContainer(String(over.id));
    if (!from || !to || from === to) return;

    setColumns((prev) => {
      const item = prev[from].find((entry) => entry.id === active.id);
      if (!item) return prev;
      const target = prev[to];
      const overIndex = target.findIndex((entry) => entry.id === over.id);
      const index = overIndex >= 0 ? overIndex : target.length;
      return {
        ...prev,
        [from]: prev[from].filter((entry) => entry.id !== active.id),
        [to]: [...target.slice(0, index), { ...item, tripDayId: to }, ...target.slice(index)],
      };
    });
  }

  async function handleDragEnd({ active, over }: DragEndEvent) {
    setDragging(false);
    let next = columns;

    if (over) {
      const from = findContainer(String(active.id));
      const to = findContainer(String(over.id));
      if (from && to && from === to) {
        const oldIndex = columns[from].findIndex((item) => item.id === active.id);
        const newIndex = columns[to].findIndex((item) => item.id === over.id);
        if (oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex) {
          next = { ...columns, [from]: arrayMove(columns[from], oldIndex, newIndex) };
          setColumns(next);
        }
      }
    }

    const before = snapshot;
    setSnapshot(null);
    if (!before || signature(before) === signature(next)) return;

    setSaving(true);
    try {
      await apiPatch(`/trips/${tripId}/itinerary/reorder`, {
        days: days.map((day) => ({ tripDayId: day.id, itemIds: (next[day.id] ?? []).map((item) => item.id) })),
      });
    } catch (err) {
      setColumns(before);
      setError(err instanceof ApiClientError ? err.message : "Gagal menyimpan urutan");
    } finally {
      setSaving(false);
    }
  }

  function handleDragCancel() {
    if (snapshot) setColumns(snapshot);
    setSnapshot(null);
    setDragging(false);
  }

  function updateItem(updated: ItineraryItemDTO) {
    setColumns((prev) => ({
      ...prev,
      [updated.tripDayId]: (prev[updated.tripDayId] ?? []).map((item) => (item.id === updated.id ? updated : item)),
    }));
  }

  function removeItem(itemId: string) {
    setColumns((prev) => {
      const next: Columns = {};
      for (const key of Object.keys(prev)) next[key] = prev[key].filter((item) => item.id !== itemId);
      return next;
    });
  }

  const totalItems = Object.values(columns).reduce((sum, list) => sum + list.length, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-3">
        {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        {totalItems === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center">
            <p className="text-sm text-neutral-600">Belum ada tempat di itinerary ini.</p>
            {canEdit ? (
              <Link href="/dashboard/explore" className="mt-3 inline-block text-sm font-medium text-teal-800 hover:underline">
                Jelajahi tempat untuk ditambahkan
              </Link>
            ) : null}
          </div>
        ) : null}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          {days.map((day) => {
            const items = columns[day.id] ?? [];
            const isActive = day.id === activeDayId;
            return (
              <section
                key={day.id}
                className={cn(
                  "space-y-2 rounded-xl border bg-neutral-50 p-3 transition",
                  isActive ? "border-teal-700" : "border-neutral-200",
                )}
              >
                <div className="flex items-center justify-between gap-3 px-1">
                  <div>
                    <h2 className="font-semibold text-neutral-900">Hari {day.dayNumber}</h2>
                    <p className="text-xs text-neutral-500">
                      {formatDateID(day.date)} · {items.length} tempat
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveDayId(day.id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition",
                      isActive
                        ? "border-teal-800 bg-teal-800 text-white"
                        : "border-neutral-300 bg-white text-neutral-700 hover:border-teal-300",
                    )}
                  >
                    <MapPin className="size-3.5" />
                    {isActive ? "Di peta" : "Lihat di peta"}
                  </button>
                </div>

                <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                  <DayColumn dayId={day.id}>
                    {items.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-neutral-300 px-3 py-4 text-center text-xs text-neutral-400">
                        {canEdit ? "Seret tempat ke sini" : "Belum ada tempat"}
                      </p>
                    ) : null}
                    {items.map((item, index) => (
                      <SortableItem
                        key={item.id}
                        item={item}
                        index={index}
                        canEdit={canEdit}
                        tripId={tripId}
                        leg={isActive && shownRoute && !dragging ? (shownRoute.legs[index] ?? null) : null}
                        onUpdate={updateItem}
                        onRemove={removeItem}
                      />
                    ))}
                  </DayColumn>
                </SortableContext>

                {canEdit ? (
                  <Link
                    href="/dashboard/explore"
                    className="inline-flex items-center gap-1.5 px-1 text-xs font-medium text-teal-800 hover:underline"
                  >
                    <Plus className="size-3.5" />
                    Tambah tempat
                  </Link>
                ) : null}
              </section>
            );
          })}
        </DndContext>
      </div>

      <div className="space-y-3 lg:sticky lg:top-20 lg:col-span-2 lg:self-start">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <select
            value={activeDayId}
            onChange={(event) => setActiveDayId(event.target.value)}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm"
          >
            {days.map((day) => (
              <option key={day.id} value={day.id}>
                Hari {day.dayNumber} · {formatDateID(day.date)}
              </option>
            ))}
          </select>
          <div className="flex gap-1">
            {ROUTE_MODES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs transition",
                  mode === value
                    ? "border-teal-800 bg-teal-800 text-white"
                    : "border-neutral-300 bg-white text-neutral-700 hover:border-teal-300",
                )}
              >
                {ROUTE_MODE_LABELS[value]}
              </button>
            ))}
          </div>
        </div>

        <div className="h-80 lg:h-[60vh]">
          <ItineraryMap stops={stops} route={shownRoute} />
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700">
          {!hasRoute ? (
            <span className="text-neutral-500">Tambahkan minimal 2 tempat untuk melihat rute.</span>
          ) : shownRouteLoading ? (
            <span className="text-neutral-500">Menghitung rute...</span>
          ) : shownRouteError ? (
            <span className="text-red-600">{shownRouteError}</span>
          ) : shownRoute ? (
            <span>
              Total <strong>{formatDistance(shownRoute.distance)}</strong> · <strong>{formatDuration(shownRoute.time)}</strong> ·{" "}
              {ROUTE_MODE_LABELS[mode]}
            </span>
          ) : null}
        </div>

        <p className="text-right text-xs text-neutral-400">
          Rute oleh{" "}
          <a href="https://www.geoapify.com/" target="_blank" rel="noopener noreferrer" className="underline">
            Geoapify
          </a>{" "}
          · © OpenStreetMap contributors
        </p>
      </div>
    </div>
  );
}