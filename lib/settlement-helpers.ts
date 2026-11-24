import "server-only";
import { prisma } from "@/lib/prisma";
import { computeBalances, simplifyDebts } from "@/lib/settlement";
import type { ParticipantDTO, SettlementSummaryDTO } from "@/@type/settlement";

export async function listParticipants(tripId: string): Promise<ParticipantDTO[]> {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: {
      user: { select: { id: true, name: true, email: true } },
      members: { orderBy: { createdAt: "asc" }, select: { user: { select: { id: true, name: true, email: true } } } },
    },
  });
  if (!trip) return [];

  const users = [trip.user, ...trip.members.map((member) => member.user)];
  return users.map((user) => ({ id: user.id, name: user.name?.trim() || user.email }));
}

export async function getSettlementSummary(tripId: string): Promise<SettlementSummaryDTO> {
  const [participants, expenses, payments] = await Promise.all([
    listParticipants(tripId),
    prisma.expense.findMany({
      where: { tripId },
      select: { amount: true, paidById: true, shares: { select: { userId: true } } },
    }),
    prisma.tripSettlement.findMany({ where: { tripId }, orderBy: { createdAt: "desc" } }),
  ]);

  const split = expenses.map((expense) => ({
    amount: Number(expense.amount.toString()),
    paidById: expense.paidById,
    shareUserIds: expense.shares.map((share) => share.userId),
  }));
  const paymentRows = payments.map((payment) => ({
    id: payment.id,
    fromUserId: payment.fromUserId,
    toUserId: payment.toUserId,
    amount: Math.round(Number(payment.amount.toString())),
    createdAt: payment.createdAt.toISOString(),
  }));

  const balances = computeBalances(split, paymentRows);
  const nameById = new Map(participants.map((person) => [person.id, person.name]));

  return {
    participants,
    balances: participants.map((person) => ({
      userId: person.id,
      name: person.name,
      balance: balances.get(person.id) ?? 0,
    })),
    transfers: simplifyDebts(balances),
    payments: paymentRows.filter((payment) => nameById.has(payment.fromUserId) && nameById.has(payment.toUserId)),
    sharedTotal: split.reduce((sum, expense) => (expense.paidById && expense.shareUserIds.length > 0 ? sum + Math.round(expense.amount) : sum), 0),
    unassignedCount: split.filter((expense) => !expense.paidById || expense.shareUserIds.length === 0).length,
  };
}