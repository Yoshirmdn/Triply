import { describe, expect, it } from "vitest";
import {
  inviteMemberSchema,
  updateMemberSchema,
} from "@/lib/validations/member.schema";

describe("member schemas", () => {
  it("normalizes email and defaults the role to viewer", () => {
    const result = inviteMemberSchema.parse({ email: "  Teman@Gmail.COM " });
    expect(result.email).toBe("teman@gmail.com");
    expect(result.role).toBe("VIEWER");
  });

  it("rejects invalid emails and unknown roles", () => {
    expect(inviteMemberSchema.safeParse({ email: "bukan-email" }).success).toBe(
      false,
    );
    expect(
      inviteMemberSchema.safeParse({ email: "a@b.com", role: "OWNER" }).success,
    ).toBe(false);
    expect(updateMemberSchema.safeParse({ role: "OWNER" }).success).toBe(false);
  });

  it("accepts editor and viewer updates", () => {
    expect(updateMemberSchema.safeParse({ role: "EDITOR" }).success).toBe(true);
    expect(updateMemberSchema.safeParse({ role: "VIEWER" }).success).toBe(true);
  });
});
