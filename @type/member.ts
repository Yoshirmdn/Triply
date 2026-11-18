import type { MemberRoleValue } from "@/data/member";

export type TripPersonDTO = {
  id: string;
  kind: "owner" | "member" | "invite";
  userId: string | null;
  name: string | null;
  email: string;
  role: "OWNER" | MemberRoleValue;
};

export type TripPeopleDTO = {
  people: TripPersonDTO[];
  isOwner: boolean;
};
