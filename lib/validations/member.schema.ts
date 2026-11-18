import { z } from "zod";
import { MEMBER_ROLES } from "@/data/member";

export const inviteMemberSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Email tidak valid")),
  role: z.enum(MEMBER_ROLES).default("VIEWER"),
});

export const updateMemberSchema = z.object({
  role: z.enum(MEMBER_ROLES),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
