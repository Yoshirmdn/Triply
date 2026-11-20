export const CHECKLIST_KINDS = ["PACKING", "TODO"] as const;
export type ChecklistKindValue = (typeof CHECKLIST_KINDS)[number];

export const CHECKLIST_KIND_LABELS: Record<ChecklistKindValue, string> = {
  PACKING: "Packing list",
  TODO: "Persiapan",
};

export const CHECKLIST_PRESETS: Record<ChecklistKindValue, string[]> = {
  PACKING: [
    "KTP / identitas",
    "Dompet dan uang tunai",
    "Ponsel dan charger",
    "Power bank",
    "Pakaian secukupnya",
    "Pakaian dalam",
    "Perlengkapan mandi",
    "Obat pribadi",
    "Jas hujan atau payung",
    "Sandal dan sepatu nyaman",
    "Botol minum",
    "Tas kecil untuk jalan",
  ],
  TODO: [
    "Pesan transportasi",
    "Pesan penginapan",
    "Cek cuaca sehari sebelum berangkat",
    "Unduh peta offline",
    "Bagikan itinerary ke keluarga",
    "Isi saldo e-money",
    "Cek jam buka tempat tujuan",
  ],
};

export const MAX_CHECKLIST_ITEMS = 200;

export const NOTE_KINDS = ["NOTE", "BOOKING"] as const;
export type NoteKindValue = (typeof NOTE_KINDS)[number];

export const NOTE_KIND_LABELS: Record<NoteKindValue, string> = {
  NOTE: "Catatan",
  BOOKING: "Booking & tiket",
};

export const MAX_TRIP_NOTES = 100;
