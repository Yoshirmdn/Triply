export type ParticipantDTO = {
  id: string;
  name: string;
};

export type BalanceDTO = {
  userId: string;
  name: string;
  balance: number;
};

export type TransferDTO = {
  fromUserId: string;
  toUserId: string;
  amount: number;
};

export type PaymentDTO = {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  createdAt: string;
};

export type SettlementSummaryDTO = {
  participants: ParticipantDTO[];
  balances: BalanceDTO[];
  transfers: TransferDTO[];
  payments: PaymentDTO[];
  sharedTotal: number;
  unassignedCount: number;
};