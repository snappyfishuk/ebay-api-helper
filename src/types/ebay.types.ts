// types/ebay.types.ts
export interface EbayAmount {
  value: string | number;
  currencyCode: string;
}

export interface EbayReference {
  referenceType: 'ORDER_ID' | 'ITEM_ID' | 'PAYOUT_ID' | 'TRANSACTION_ID' | 'INVOICE_ID' | 'DISPUTE_ID';
  referenceId: string;
}

export interface EbayTransaction {
  transactionId: string;
  transactionDate: string;
  transactionType: 'SALE' | 'REFUND' | 'WITHDRAWAL' | 'NON_SALE_CHARGE' | 'DISPUTE' | 'TRANSFER' | 'ADJUSTMENT' | 'CREDIT' | 'DEBIT';
  transactionMemo?: string;
  amount: EbayAmount;
  bookingEntry?: 'DEBIT' | 'CREDIT';
  references?: EbayReference[];
  salesRecordReference?: string;
  transactionStatus?: 'FUNDS_PROCESSING' | 'FUNDS_ON_HOLD' | 'FUNDS_AVAILABLE_FOR_PAYOUT' | 'PAYOUT_INITIATED' | 'COMPLETED';
}