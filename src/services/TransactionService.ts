// services/TransactionService.ts
import {
  EbayTransaction,
  FreeAgentEntry,
  ProcessedTransactionData,
  TRANSACTION_TYPE_MAP,
  CATEGORY_MAP,
  DEBIT_TRANSACTION_TYPES,
} from '../types';

export class TransactionService {
  /**
   * SIMPLIFIED: Just for DISPLAY in the frontend UI
   * The backend handles all FreeAgent formatting
   */
  public generateDisplayDescription(txn: EbayTransaction): string {
    const {
      transactionType,
      transactionMemo,
      transactionId,
      salesRecordReference,
    } = txn;

    // Simple display format for the UI only
    if (transactionMemo && transactionMemo !== "No description") {
      return transactionMemo;
    }
    
    const typeLabel = TRANSACTION_TYPE_MAP[transactionType] || transactionType;
    const reference = salesRecordReference || transactionId || '';
    
    return reference ? `${typeLabel} - ${reference}` : `eBay ${typeLabel}`;
  }

  private formatTransactionType(transactionType: EbayTransaction['transactionType']): string {
    return TRANSACTION_TYPE_MAP[transactionType] || transactionType;
  }

  /**
   * SIMPLIFIED: Process transactions for display and CSV export
   * Send RAW data to backend for FreeAgent formatting
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

    console.log(`Processing ${ebayTransactions.length} transactions...`);

    // IMPORTANT: Send RAW eBay data to backend
    // Backend will handle all formatting for FreeAgent
    // This is just for local display/preview
    const freeAgentEntries = ebayTransactions
      .map((txn) => {
        const originalAmount = parseFloat(txn.amount?.value?.toString() || '0');
        const isDebit = this.determineIfDebit(txn, originalAmount);
        const displayAmount = Math.abs(originalAmount);

        return {
          dated_on: new Date(txn.transactionDate).toISOString().split("T")[0],
          amount: isDebit ? -displayAmount : displayAmount,
          // Use simple display description - backend will format for FreeAgent
          description: this.generateDisplayDescription(txn).substring(0, 255),
          reference: txn.transactionId?.toString().substring(0, 50),
          category: this.determineTransactionCategory(txn),
          transactionType: isDebit ? "debit" as const : "credit" as const,
          isDebit: isDebit,
          originalAmount: originalAmount,
          displayAmount: displayAmount,
          // IMPORTANT: Include raw transaction for backend processing
          rawTransaction: txn,
        };
      })
      .filter((txn) => txn.amount !== 0);

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
   * Determines if a transaction is a debit
   */
  private determineIfDebit(txn: EbayTransaction, amount: number): boolean {
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
   * Export to CSV for local download (not for FreeAgent sync)
   */
  public exportToCsv(processedData: ProcessedTransactionData): void {
    if (!processedData || !processedData.freeAgentEntries) return;

    const csvRows = processedData.freeAgentEntries.map((entry) => {
      const dateParts = entry.dated_on.split('-');
      const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
      const amount = entry.amount;
      const cleanDescription = entry.description
        .replace(/"/g, '')
        .replace(/,/g, ';')
        .trim();
      
      return `${formattedDate},${amount.toFixed(2)},${cleanDescription}`;
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ebay-transactions-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log(`✅ Exported ${csvRows.length} transactions to CSV`);
  }
}