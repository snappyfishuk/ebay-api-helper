// types/freeagent.types.ts
export interface FreeAgentBankAccount {
  id: string;
  url: string;
  name: string;
  type: string;
  currency: string;
  apiUrl?: string;
}

export interface FreeAgentEntry {
  dated_on: string;
  amount: number;
  description: string;
  reference?: string;
  category: string;
  transactionType?: 'debit' | 'credit';
  isDebit: boolean;
  originalAmount: number;
  displayAmount: number;
}

export interface ProcessedTransactionData {
  freeAgentEntries: FreeAgentEntry[];
  totalAmount: number;
  creditCount: number;
  debitCount: number;
  netAmount: number;
}