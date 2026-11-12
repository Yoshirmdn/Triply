import Link from "next/link";
import { requirePageUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { loadTripOrNotFound } from "@/lib/page-helpers";
import { getExpenseSummary, serializeExpense } from "@/lib/expense-helpers";
import { BudgetClient } from "@/components/fragment/budget-client";

type BudgetPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: BudgetPageProps) {
  const actor = await requirePageUser();
  const { id } = await params;
  const trip = await loadTripOrNotFound(actor, id);
  return { title: `Budget · ${trip.title}` };
}

export default async function BudgetPage({ params }: BudgetPageProps) {
  const actor = await requirePageUser();
  const { id } = await params;
  const trip = await loadTripOrNotFound(actor, id);

  const [expenses, summary] = await Promise.all([
    prisma.expense.findMany({
      where: { tripId: trip.id },
      orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
      take: 200,
    }),
    getExpenseSummary(trip.id, trip.budget),
  ]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link href={`/dashboard/trips/${trip.id}`} className="text-sm text-neutral-500 hover:text-neutral-900">
          ← {trip.title}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Budget & pengeluaran</h1>
      </div>

      <BudgetClient
        tripId={trip.id}
        canEdit={trip.canEdit}
        defaultDate={trip.startDate}
        expenses={expenses.map(serializeExpense)}
        summary={summary}
      />
    </div>
  );
}