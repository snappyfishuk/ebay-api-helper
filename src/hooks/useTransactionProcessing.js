// hooks/useTransactionProcessing.js - The FULL enhanced logic
export const useTransactionProcessing = () => {
  // SECTION 1: ENHANCED DESCRIPTION GENERATION
  const generateEnhancedTransactionDescription = (txn) => {
    const {
      transactionType,
      transactionMemo,
      references = [],
      salesRecordReference,
      transactionStatus,
    } = txn;

    let description = "";

    if (transactionMemo && transactionMemo !== "No description") {
      description = transactionMemo;
    } else {
      description = `eBay ${formatTransactionType(transactionType)}`;
    }

    const meaningfulReference = getMeaningfulReference(
      references,
      salesRecordReference
    );
    if (meaningfulReference) {
      description += ` - ${meaningfulReference}`;
    }

    if (needsStatusInfo(transactionStatus)) {
      description += ` (${formatTransactionStatus(transactionStatus)})`;
    }

    return description.substring(0, 255);
  };

  const formatTransactionType = (transactionType) => {
    const typeMap = {
      SALE: "Sale",
      REFUND: "Refund",
      WITHDRAWAL: "Payout/Withdrawal",
      NON_SALE_CHARGE: "Fee/Charge",
      DISPUTE: "Dispute",
      TRANSFER: "Transfer",
      ADJUSTMENT: "Adjustment",
      CREDIT: "Credit",
      DEBIT: "Debit",
    };
    return typeMap[transactionType] || transactionType;
  };

  const getMeaningfulReference = (references, salesRecordReference) => {
    if (!references || references.length === 0) {
      return salesRecordReference && salesRecordReference !== "0"
        ? `Ref: ${salesRecordReference}`
        : null;
    }

    const priorityOrder = [
      "ORDER_ID",
      "ITEM_ID",
      "PAYOUT_ID",
      "TRANSACTION_ID",
      "INVOICE_ID",
    ];

    const sortedRefs = references.sort((a, b) => {
      const aIndex = priorityOrder.indexOf(a.referenceType);
      const bIndex = priorityOrder.indexOf(b.referenceType);
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });

    const topRef = sortedRefs[0];
    return formatReference(topRef.referenceType, topRef.referenceId);
  };

  const formatReference = (referenceType, referenceId) => {
    const formatMap = {
      ORDER_ID: `Order #${referenceId}`,
      ITEM_ID: `Item #${referenceId}`,
      PAYOUT_ID: `Payout #${referenceId}`,
      TRANSACTION_ID: `Transaction #${referenceId}`,
      INVOICE_ID: `Invoice #${referenceId}`,
      DISPUTE_ID: `Dispute #${referenceId}`,
    };
    return formatMap[referenceType] || `${referenceType}: ${referenceId}`;
  };

  const needsStatusInfo = (transactionStatus) => {
    const statusesNeedingInfo = [
      "FUNDS_PROCESSING",
      "FUNDS_ON_HOLD",
      "FUNDS_AVAILABLE_FOR_PAYOUT",
      "PAYOUT_INITIATED",
    ];
    return statusesNeedingInfo.includes(transactionStatus);
  };

  const formatTransactionStatus = (transactionStatus) => {
    const statusMap = {
      FUNDS_PROCESSING: "Processing",
      FUNDS_ON_HOLD: "On Hold",
      FUNDS_AVAILABLE_FOR_PAYOUT: "Ready for Payout",
      PAYOUT_INITIATED: "Payout Initiated",
      COMPLETED: "Completed",
    };
    return statusMap[transactionStatus] || transactionStatus;
  };

  // SECTION 2: TRANSACTION CLASSIFICATION
  const determineIfDebit = (txn, amount) => {
    if (
      txn.bookingEntry === "DEBIT" ||
      txn.transactionType === "WITHDRAWAL" ||
      txn.transactionType === "NON_SALE_CHARGE" ||
      txn.transactionType === "REFUND" ||
      amount < 0
    ) {
      return true;
    }
    return false;
  };

  const determineTransactionCategory = (txn) => {
    const categoryMap = {
      SALE: "Sales",
      REFUND: "Refunds",
      NON_SALE_CHARGE: "Business Expenses",
      WITHDRAWAL: "Bank Transfers",
      DISPUTE: "Disputes",
      ADJUSTMENT: "Adjustments",
      TRANSFER: "Transfers",
    };
    return categoryMap[txn.transactionType] || "Other";
  };

  // SECTION 3: ENHANCED PROCESSING FUNCTION (THE CRITICAL ONE)
  const processTransactionsForFreeAgent = (ebayTransactions) => {
    if (!ebayTransactions || ebayTransactions.length === 0) {
      return { freeAgentEntries: [], creditCount: 0, debitCount: 0 };
    }

    console.log(
      `Processing ${ebayTransactions.length} transactions for FreeAgent...`
    );

    const freeAgentEntries = ebayTransactions
      .map((txn) => {
        const originalAmount = parseFloat(txn.amount?.value || 0);
        const isDebit = determineIfDebit(txn, originalAmount);
        const displayAmount = Math.abs(originalAmount);

        return {
          dated_on: new Date(txn.transactionDate).toISOString().split("T")[0],
          amount: isDebit ? -displayAmount : displayAmount,
          description: generateEnhancedTransactionDescription(txn).substring(
            0,
            255
          ),
          reference: txn.transactionId
            ? txn.transactionId.toString().substring(0, 50)
            : undefined,
          category: determineTransactionCategory(txn),
          transactionType: isDebit ? "debit" : "credit",
          isDebit: isDebit,
          originalAmount: originalAmount,
          displayAmount: displayAmount,
        };
      })
      .filter((txn) => txn.amount !== 0);

    const creditCount = freeAgentEntries.filter(
      (e) => e.transactionType === "credit"
    ).length;
    const debitCount = freeAgentEntries.filter(
      (e) => e.transactionType === "debit"
    ).length;

    console.log(
      `Processed ${freeAgentEntries.length} transactions: ${creditCount} credits, ${debitCount} debits`
    );

    return {
      freeAgentEntries,
      totalAmount: freeAgentEntries.reduce(
        (sum, entry) => sum + Math.abs(entry.amount),
        0
      ),
      creditCount,
      debitCount,
      netAmount: freeAgentEntries.reduce((sum, entry) => sum + entry.amount, 0),
    };
  };

  // SECTION 4: UTILITY FUNCTIONS
  const formatUKDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return {
    processTransactionsForFreeAgent,
    generateEnhancedTransactionDescription,
    determineIfDebit,
    determineTransactionCategory,
    formatUKDate,
    formatTransactionType,
    formatTransactionStatus,
  };
};
