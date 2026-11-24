export type SplitExpense = {
  amount: number;
  paidById: string | null;
  shareUserIds: string[];
};

export type SettlementPayment = {
  fromUserId: string;
  toUserId: string;
  amount: number;
};

export type Transfer = {
  fromUserId: string;
  toUserId: string;
  amount: number;
};

export function splitAmount(amount: number, userIds: string[]): Map<string, number> {
  const result = new Map<string, number>();
  const ids = [...new Set(userIds)].sort();
  if (ids.length === 0) return result;

  const total = Math.round(amount);
  const base = Math.floor(total / ids.length);
  const remainder = total - base * ids.length;

  ids.forEach((id, index) => {
    result.set(id, base + (index < remainder ? 1 : 0));
  });
  return result;
}

export function computeBalances(expenses: SplitExpense[], payments: SettlementPayment[]): Map<string, number> {
  const balances = new Map<string, number>();
  const add = (userId: string, value: number) => balances.set(userId, (balances.get(userId) ?? 0) + value);

  for (const expense of expenses) {
    if (!expense.paidById || expense.shareUserIds.length === 0) continue;
    add(expense.paidById, Math.round(expense.amount));
    for (const [userId, part] of splitAmount(expense.amount, expense.shareUserIds)) {
      add(userId, -part);
    }
  }

  for (const payment of payments) {
    const value = Math.round(payment.amount);
    add(payment.fromUserId, value);
    add(payment.toUserId, -value);
  }

  return balances;
}

export function simplifyDebts(balances: Map<string, number>): Transfer[] {
  const creditors: { id: string; amount: number }[] = [];
  const debtors: { id: string; amount: number }[] = [];

  for (const [id, value] of balances) {
    if (value > 0) creditors.push({ id, amount: value });
    if (value < 0) debtors.push({ id, amount: -value });
  }

  const byAmount = (a: { id: string; amount: number }, b: { id: string; amount: number }) =>
    b.amount - a.amount || a.id.localeCompare(b.id);
  creditors.sort(byAmount);
  debtors.sort(byAmount);

  const transfers: Transfer[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];
    const amount = Math.min(creditor.amount, debtor.amount);

    if (amount > 0) transfers.push({ fromUserId: debtor.id, toUserId: creditor.id, amount });

    creditor.amount -= amount;
    debtor.amount -= amount;
    if (creditor.amount === 0) ci += 1;
    if (debtor.amount === 0) di += 1;
  }

  return transfers;
}

type SplitInput = {
  paidById: string | null;
  shareUserIds: string[];
};

export type SplitResolution =
  | { ok: true; paidById: string | null; shareUserIds: string[] }
  | { ok: false; message: string };

export function resolveExpenseSplit(input: SplitInput, participantIds: string[]): SplitResolution {
  if (input.paidById === null) return { ok: true, paidById: null, shareUserIds: [] };

  const allowed = new Set(participantIds);
  if (!allowed.has(input.paidById)) return { ok: false, message: "Pembayar bukan anggota perjalanan ini" };

  const requested = [...new Set(input.shareUserIds)];
  const shareUserIds = requested.length > 0 ? requested : [...participantIds];
  if (shareUserIds.some((id) => !allowed.has(id))) {
    return { ok: false, message: "Ada peserta yang bukan anggota perjalanan ini" };
  }

  return { ok: true, paidById: input.paidById, shareUserIds };
}