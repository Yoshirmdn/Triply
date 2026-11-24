import "server-only";
import { prisma } from "@/lib/prisma";
import { TRIP_PACES, TRIP_STYLES, type TripPaceValue, type TripStyleValue } from "@/data/generator";
import type { AccountDTO, AccountImpactDTO } from "@/@type/account";

function pick<T extends string>(values: readonly T[], value: string, fallback: T): T {
  return values.find((entry) => entry === value) ?? fallback;
}

export async function loadAccount(userId: string): Promise<AccountDTO | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      defaultTravelers: true,
      defaultStyle: true,
      defaultPace: true,
    },
  });
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role,
    defaultTravelers: user.defaultTravelers,
    defaultStyle: pick<TripStyleValue>(TRIP_STYLES, user.defaultStyle, "BALANCED"),
    defaultPace: pick<TripPaceValue>(TRIP_PACES, user.defaultPace, "NORMAL"),
  };
}

export async function loadAccountImpact(userId: string): Promise<AccountImpactDTO> {
  const [ownedTrips, sharedOwnedTrips] = await Promise.all([
    prisma.trip.count({ where: { userId } }),
    prisma.trip.count({ where: { userId, OR: [{ members: { some: {} } }, { invites: { some: {} } }] } }),
  ]);
  return { ownedTrips, sharedOwnedTrips };
}