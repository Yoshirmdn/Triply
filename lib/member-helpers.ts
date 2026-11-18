import "server-only";
import { prisma } from "@/lib/prisma";
import type { TripPersonDTO } from "@/@type/member";

export async function listTripPeople(tripId: string): Promise<TripPersonDTO[]> {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: {
      user: { select: { id: true, name: true, email: true } },
      members: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          role: true,
          user: { select: { id: true, name: true, email: true } },
        },
      },
      invites: {
        orderBy: { createdAt: "asc" },
        select: { id: true, email: true, role: true },
      },
    },
  });
  if (!trip) return [];

  const people: TripPersonDTO[] = [
    {
      id: trip.user.id,
      kind: "owner",
      userId: trip.user.id,
      name: trip.user.name,
      email: trip.user.email,
      role: "OWNER",
    },
  ];

  for (const member of trip.members) {
    people.push({
      id: member.id,
      kind: "member",
      userId: member.user.id,
      name: member.user.name,
      email: member.user.email,
      role: member.role === "EDITOR" ? "EDITOR" : "VIEWER",
    });
  }

  for (const invite of trip.invites) {
    people.push({
      id: invite.id,
      kind: "invite",
      userId: null,
      name: null,
      email: invite.email,
      role: invite.role === "EDITOR" ? "EDITOR" : "VIEWER",
    });
  }

  return people;
}

export async function acceptPendingInvites(
  userId: string,
  email: string,
): Promise<number> {
  const invites = await prisma.tripInvite.findMany({
    where: { email: email.trim().toLowerCase() },
    select: {
      id: true,
      tripId: true,
      role: true,
      trip: { select: { userId: true } },
    },
  });
  if (invites.length === 0) return 0;

  for (const invite of invites) {
    if (invite.trip.userId === userId) continue;
    await prisma.tripMember.upsert({
      where: { tripId_userId: { tripId: invite.tripId, userId } },
      update: {},
      create: {
        tripId: invite.tripId,
        userId,
        role: invite.role === "EDITOR" ? "EDITOR" : "VIEWER",
      },
    });
  }

  await prisma.tripInvite.deleteMany({
    where: { id: { in: invites.map((invite) => invite.id) } },
  });
  return invites.length;
}
