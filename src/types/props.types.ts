// types/props.types.ts
import { User } from './user.types';

export interface EbayApiAccountingHelperProps {
  user: User;
}

// Constants with strict typing
export const TRANSACTION_TYPE_MAP = {
  SALE: "Sale",
  REFUND: "Refund",
  WITHDRAWAL: "Payout/Withdrawal",
  NON_SALE_CHARGE: "Fee/Charge",
  DISPUTE: "Dispute",
  TRANSFER: "Transfer",
  ADJUSTMENT: "Adjustment",
  CREDIT: "Credit",
  DEBIT: "Debit",
} as const;

export const CATEGORY_MAP = {
  SALE: "Sales",
  REFUND: "Refunds",
  NON_SALE_CHARGE: "Business Expenses",
  WITHDRAWAL: "Bank Transfers",
  DISPUTE: "Disputes",
  ADJUSTMENT: "Adjustments",
  TRANSFER: "Transfers",
} as const;

export const REFERENCE_FORMAT_MAP = {
  ORDER_ID: (id: string) => `Order #${id}`,
  ITEM_ID: (id: string) => `Item #${id}`,
  PAYOUT_ID: (id: string) => `Payout #${id}`,
  TRANSACTION_ID: (id: string) => `Transaction #${id}`,
  INVOICE_ID: (id: string) => `Invoice #${id}`,
  DISPUTE_ID: (id: string) => `Dispute #${id}`,
} as const;

export const STATUS_NEEDING_INFO = [
  'FUNDS_PROCESSING',
  'FUNDS_ON_HOLD',
  'FUNDS_AVAILABLE_FOR_PAYOUT',
  'PAYOUT_INITIATED',
] as const;

export const DEBIT_TRANSACTION_TYPES = [
  'WITHDRAWAL',
  'NON_SALE_CHARGE',
  'REFUND',
] as const;

export const REFERENCE_PRIORITY_ORDER = [
  'ORDER_ID',
  'ITEM_ID',
  'PAYOUT_ID',
  'TRANSACTION_ID',
  'INVOICE_ID',
] as const;