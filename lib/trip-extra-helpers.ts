import "server-only";
import type { Actor } from "@/@type/auth";
import type { ChecklistItemDTO, TripNoteDTO } from "@/@type/trip-extra";
import type { ChecklistKindValue, NoteKindValue } from "@/data/trip-extra";

export function canEditTrip(
  trip: { userId: string; members: { role: string }[] },
  actor: Actor,
): boolean {
  const role = trip.members[0]?.role;
  return trip.userId === actor.id || (role !== undefined && role !== "VIEWER");
}

export function serializeChecklistItem(item: {
  id: string;
  kind: ChecklistKindValue;
  text: string;
  done: boolean;
  sortOrder: number;
}): ChecklistItemDTO {
  return {
    id: item.id,
    kind: item.kind,
    text: item.text,
    done: item.done,
    sortOrder: item.sortOrder,
  };
}

export function serializeNote(note: {
  id: string;
  kind: NoteKindValue;
  title: string;
  content: string | null;
  reference: string | null;
  url: string | null;
  dayNumber: number | null;
  updatedAt: Date;
}): TripNoteDTO {
  return {
    id: note.id,
    kind: note.kind,
    title: note.title,
    content: note.content,
    reference: note.reference,
    url: note.url,
    dayNumber: note.dayNumber,
    updatedAt: note.updatedAt.toISOString(),
  };
}
