// types/sync.types.ts
export interface SyncData {
  transactions: Array<{
    dated_on: string;
    amount: number;
    description: string;
    reference?: string;
  }>;
  bankAccountId: string;
}