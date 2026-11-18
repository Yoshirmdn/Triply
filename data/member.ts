export const MEMBER_ROLES = ["EDITOR", "VIEWER"] as const;
export type MemberRoleValue = (typeof MEMBER_ROLES)[number];

export const MEMBER_ROLE_LABELS: Record<MemberRoleValue | "OWNER", string> = {
  OWNER: "Pemilik",
  EDITOR: "Editor",
  VIEWER: "Pelihat",
};

export const MEMBER_ROLE_HINTS: Record<MemberRoleValue, string> = {
  EDITOR: "Bisa mengubah itinerary dan pengeluaran",
  VIEWER: "Hanya bisa melihat",
};

export const MAX_TRIP_PEOPLE = 20;
