// services/TransactionService.ts
import {
  EbayTransaction,
  EbayReference,
  FreeAgentEntry,
  ProcessedTransactionData,
  TRANSACTION_TYPE_MAP,
  CATEGORY_MAP,
  REFERENCE_FORMAT_MAP,
  STATUS_NEEDING_INFO,
  DEBIT_TRANSACTION_TYPES,
  REFERENCE_PRIORITY_ORDER
} from '../types';

export class TransactionService {
  /**
   * CRITICAL: This function generates enhanced transaction descriptions
   * using eBay's rich data. ALL logic must be preserved for accurate descriptions.
   */
  public generateEnhancedTransactionDescription(txn: EbayTransaction): string {
    const {
      transactionType,
      transactionMemo,
      references = [],
      salesRecordReference,
      transactionStatus,
    } = txn;

    let description = "";

    // IMPORTANT: Check for meaningful memo first
    if (transactionMemo && transactionMemo !== "No description") {
      description = transactionMemo;
    } else {
      description = `eBay ${this.formatTransactionType(transactionType)}`;
    }

    // IMPORTANT: Add meaningful reference if available
    const meaningfulReference = this.getMeaningfulReference(
      references,
      salesRecordReference
    );
    if (meaningfulReference) {
      description += ` - ${meaningfulReference}`;
    }

    // IMPORTANT: Add status info for specific transaction statuses
    if (transactionStatus && this.needsStatusInfo(transactionStatus)) {
      description += ` (${this.formatTransactionStatus(transactionStatus)})`;
    }

    // Ensure description doesn't exceed FreeAgent's 255 character limit
    return description.substring(0, 255);
  }

  private formatTransactionType(transactionType: EbayTransaction['transactionType']): string {
    return TRANSACTION_TYPE_MAP[transactionType] || transactionType;
  }

  /**
   * CRITICAL: This prioritizes references to show the most meaningful one.
   * The priority order is essential for useful transaction descriptions.
   */
  private getMeaningfulReference(
    references: EbayReference[] | undefined,
    salesRecordReference: string | undefined
  ): string | null {
    // IMPORTANT: Fallback to salesRecordReference if no references array
    if (!references || references.length === 0) {
      return salesRecordReference && salesRecordReference !== "0"
        ? `Ref: ${salesRecordReference}`
        : null;
    }

    // CRITICAL: Sort by priority order - this order is intentional
    const sortedRefs = references.sort((a, b) => {
      const aIndex = REFERENCE_PRIORITY_ORDER.indexOf(a.referenceType as any);
      const bIndex = REFERENCE_PRIORITY_ORDER.indexOf(b.referenceType as any);
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });

    const topRef = sortedRefs[0];
    return this.formatReference(topRef.referenceType, topRef.referenceId);
  }

  private formatReference(
    referenceType: EbayReference['referenceType'],
    referenceId: string
  ): string {
    const formatter = REFERENCE_FORMAT_MAP[referenceType];
    return formatter ? formatter(referenceId) : `${referenceType}: ${referenceId}`;
  }

  private needsStatusInfo(transactionStatus: string): boolean {
    return STATUS_NEEDING_INFO.includes(transactionStatus as any);
  }

  private formatTransactionStatus(transactionStatus: string): string {
    const statusMap: Record<string, string> = {
      FUNDS_PROCESSING: "Processing",
      FUNDS_ON_HOLD: "On Hold",
      FUNDS_AVAILABLE_FOR_PAYOUT: "Ready for Payout",
      PAYOUT_INITIATED: "Payout Initiated",
      COMPLETED: "Completed",
    };
    return statusMap[transactionStatus] || transactionStatus;
  }

  /**
   * CRITICAL: Process transactions for FreeAgent with proper debit/credit determination
   * This logic ensures accurate accounting entries.
   */
  public processTransactionsForFreeAgent(
    ebayTransactions: EbayTransaction[]
  ): ProcessedTransactionData {
    if (!ebayTransactions || ebayTransactions.length === 0) {
      return { 
        freeAgentEntries: [], 
        creditCount: 0, 
        debitCount: 0,
        totalAmount: 0,
        netAmount: 0
      };
    }

    console.log(`Processing ${ebayTransactions.length} transactions for FreeAgent...`);

    const freeAgentEntries = ebayTransactions
      .map((txn) => {
        const originalAmount = parseFloat(txn.amount?.value?.toString() || '0');
        const isDebit = this.determineIfDebit(txn, originalAmount);
        const displayAmount = Math.abs(originalAmount);

        return {
          dated_on: new Date(txn.transactionDate).toISOString().split("T")[0],
          amount: isDebit ? -displayAmount : displayAmount,
          description: this.generateEnhancedTransactionDescription(txn).substring(0, 255),
          reference: txn.transactionId
            ? txn.transactionId.toString().substring(0, 50)
            : undefined,
          category: this.determineTransactionCategory(txn),
          transactionType: isDebit ? "debit" as const : "credit" as const,
          isDebit: isDebit,
          originalAmount: originalAmount,
          displayAmount: displayAmount,
        };
      })
      .filter((txn) => txn.amount !== 0); // IMPORTANT: Filter out zero-amount transactions

    const creditCount = freeAgentEntries.filter(e => e.transactionType === "credit").length;
    const debitCount = freeAgentEntries.filter(e => e.transactionType === "debit").length;

    console.log(
      `Processed ${freeAgentEntries.length} transactions: ${creditCount} credits, ${debitCount} debits`
    );

    return {
      freeAgentEntries,
      totalAmount: freeAgentEntries.reduce((sum, entry) => sum + Math.abs(entry.amount), 0),
      creditCount,
      debitCount,
      netAmount: freeAgentEntries.reduce((sum, entry) => sum + entry.amount, 0),
    };
  }

  /**
   * CRITICAL: Determines if a transaction is a debit.
   * This logic is crucial for accurate accounting.
   */
  private determineIfDebit(txn: EbayTransaction, amount: number): boolean {
    // Multiple conditions for determining debit - ALL are important
    if (
      txn.bookingEntry === "DEBIT" ||
      DEBIT_TRANSACTION_TYPES.includes(txn.transactionType as any) ||
      amount < 0
    ) {
      return true;
    }
    return false;
  }

  private determineTransactionCategory(txn: EbayTransaction): string {
    return CATEGORY_MAP[txn.transactionType as keyof typeof CATEGORY_MAP] || "Other";
  }

/**
 * Export transactions to CSV with FreeAgent format
 * Format: Date,Money Out,Money In,Description
 * As per: https://support.freeagent.com/hc/en-gb/articles/115001222564-Format-a-CSV-file-to-upload-a-bank-statement
 */
public exportToCsv(processedData: ProcessedTransactionData): void {
  if (!processedData || !processedData.freeAgentEntries) return;

  // Convert to FreeAgent CSV format
  const csvRows = processedData.freeAgentEntries.map((entry) => {
    // Convert ISO date (YYYY-MM-DD) to DD/MM/YYYY format preferred by FreeAgent
    const dateParts = entry.dated_on.split('-');
    const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    
    // Split amount into Money Out and Money In columns
    const amount = Math.abs(entry.amount);
    const moneyOut = entry.amount < 0 ? amount.toFixed(2) : '';
    const moneyIn = entry.amount > 0 ? amount.toFixed(2) : '';
    
    // Escape quotes in description and wrap in quotes
    const description = `"${entry.description.replace(/"/g, '""')}"`;
    
    return `${formattedDate},${moneyOut},${moneyIn},${description}`;
  });

  // FreeAgent CSV header
  const header = "Date,Money Out,Money In,Description";
  const csvContent = header + "\n" + csvRows.join("\n");

  // Download the file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ebay-freeagent-statement-${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
}