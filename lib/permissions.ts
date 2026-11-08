import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors";
import { uuidSchema } from "@/lib/validations/common.schema";
import type { Actor, AppRole } from "@/@type/auth";

type ActorResolution = {
  actor: Actor | null;
  inactive: boolean;
};

export function homePathForRole(role: AppRole): string {
  return role === "SUPER_ADMIN" ? "/admin" : "/dashboard";
}

export async function resolveActor(): Promise<ActorResolution> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { actor: null, inactive: false };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true, isActive: true },
  });
  if (!user) return { actor: null, inactive: false };
  if (!user.isActive) return { actor: null, inactive: true };

  return {
    actor: { id: user.id, email: user.email, name: user.name, role: user.role },
    inactive: false,
  };
}

export async function requireUser(): Promise<Actor> {
  const { actor, inactive } = await resolveActor();
  if (inactive) throw new ApiError("FORBIDDEN", "Akun tidak aktif");
  if (!actor) throw new ApiError("UNAUTHORIZED", "Autentikasi diperlukan");
  return actor;
}

export async function requireRole(role: AppRole): Promise<Actor> {
  const actor = await requireUser();
  if (actor.role !== role) throw new ApiError("FORBIDDEN", "Akses ditolak");
  return actor;
}

export async function requirePageUser(): Promise<Actor> {
  const { actor, inactive } = await resolveActor();
  if (inactive) redirect("/login?error=inactive");
  if (!actor) redirect("/login");
  return actor;
}

export async function requirePageRole(role: AppRole): Promise<Actor> {
  const actor = await requirePageUser();
  if (actor.role !== role) redirect(homePathForRole(actor.role));
  return actor;
}

export type TripAccessLevel = "read" | "write";

export async function assertTripAccess(tripId: string, actor: Actor, level: TripAccessLevel) {
  const id = uuidSchema.parse(tripId);

  const trip = await prisma.trip.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      members: { where: { userId: actor.id }, select: { role: true } },
    },
  });
  if (!trip) throw new ApiError("NOT_FOUND", "Perjalanan tidak ditemukan");

  if (trip.userId === actor.id) return { tripId: trip.id, access: "owner" as const };

  const member = trip.members[0];
  if (!member) throw new ApiError("NOT_FOUND", "Perjalanan tidak ditemukan");
  if (level === "write" && member.role === "VIEWER") {
    throw new ApiError("FORBIDDEN", "Kamu tidak punya izin mengubah perjalanan ini");
  }
  return { tripId: trip.id, access: "member" as const };
}