export type IcsItem = {
  id: string;
  title: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  dayNumber: number;
};

type BuildIcsInput = {
  tripTitle: string;
  items: IcsItem[];
  now?: Date;
};

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

export function foldIcsLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;

  const parts: string[] = [];
  let current = "";
  let currentBytes = 0;
  let limit = 75;

  for (const char of line) {
    const bytes = encoder.encode(char).length;
    if (currentBytes + bytes > limit) {
      parts.push(current);
      current = "";
      currentBytes = 0;
      limit = 74;
    }
    current += char;
    currentBytes += bytes;
  }
  parts.push(current);

  return parts.join("\r\n ");
}

function compactDate(date: string): string {
  return date.replaceAll("-", "");
}

function nextDate(date: string): string {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().slice(0, 10);
}

function addMinutes(time: string, minutes: number): string {
  const [hours, mins] = time.split(":").map(Number);
  const total = Math.min(hours * 60 + mins + minutes, 23 * 60 + 59);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function compactTime(time: string): string {
  return `${time.replace(":", "")}00`;
}

function utcStamp(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

export function slugify(value: string): string {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "itinerary";
}

export function buildIcs(input: BuildIcsInput): string {
  const stamp = utcStamp(input.now ?? new Date());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Triply//Itinerary//ID",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcsText(input.tripTitle)}`,
  ];

  for (const item of input.items) {
    const start =
      item.startTime && TIME_PATTERN.test(item.startTime)
        ? item.startTime
        : null;
    const endCandidate =
      item.endTime && TIME_PATTERN.test(item.endTime) ? item.endTime : null;
    const end = start
      ? endCandidate && endCandidate > start
        ? endCandidate
        : addMinutes(start, 60)
      : null;

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${item.id}@triply`);
    lines.push(`DTSTAMP:${stamp}`);

    if (start && end) {
      lines.push(`DTSTART:${compactDate(item.date)}T${compactTime(start)}`);
      lines.push(`DTEND:${compactDate(item.date)}T${compactTime(end)}`);
    } else {
      lines.push(`DTSTART;VALUE=DATE:${compactDate(item.date)}`);
      lines.push(`DTEND;VALUE=DATE:${compactDate(nextDate(item.date))}`);
    }

    lines.push(`SUMMARY:${escapeIcsText(item.title)}`);
    if (item.address) lines.push(`LOCATION:${escapeIcsText(item.address)}`);
    if (item.latitude !== null && item.longitude !== null)
      lines.push(`GEO:${item.latitude};${item.longitude}`);

    const description = [
      item.notes,
      `Hari ${item.dayNumber} · ${input.tripTitle}`,
    ]
      .filter(Boolean)
      .join("\n");
    lines.push(`DESCRIPTION:${escapeIcsText(description)}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return `${lines.map(foldIcsLine).join("\r\n")}\r\n`;
}
