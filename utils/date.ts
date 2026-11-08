const DAY_MS = 86_400_000;

export function parseDateInput(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function todayUTC(): Date {
  return parseDateInput(new Date().toISOString().slice(0, 10));
}

export function countDays(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1;
}

export function buildDateRange(start: Date, end: Date): Date[] {
  const total = countDays(start, end);
  return Array.from({ length: Math.max(total, 0) }, (_, index) => new Date(start.getTime() + index * DAY_MS));
}

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const longDateFormatter = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDateID(value: string | Date): string {
  const date = typeof value === "string" ? parseDateInput(value) : value;
  return dateFormatter.format(date);
}

export function formatLongDateID(value: string | Date): string {
  const date = typeof value === "string" ? parseDateInput(value) : value;
  return longDateFormatter.format(date);
}

export function formatDateTimeID(value: Date): string {
  return dateTimeFormatter.format(value);
}