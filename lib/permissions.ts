import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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