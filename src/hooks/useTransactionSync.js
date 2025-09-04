// hooks/useTransactionSync.js - Updated to use enhanced processing
import { useState } from "react";
import { useTransactionProcessing } from "./useTransactionProcessing";

export const useTransactionSync = (connections, setupStatus) => {
  const [transactions, setTransactions] = useState([]);
  const [processedData, setProcessedData] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Use the enhanced processing hook
  const { processTransactionsForFreeAgent } = useTransactionProcessing();

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const fetchTransactions = async (dateRange) => {
    if (!setupStatus.canFetch) {
      setError("Please connect to eBay first");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/ebay/transactions?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
        { headers: getAuthHeaders(), credentials: "include" }
      );

      const data = await response.json();

      if (response.ok) {
        const txns = data.data?.transactions || [];
        setTransactions(txns);

        // Use the ENHANCED processing function
        const processed = processTransactionsForFreeAgent(txns);
        setProcessedData(processed);

        setSyncStatus(
          `Fetched ${txns.length} transactions with enhanced descriptions`
        );

        console.log(`Enhanced processing complete:`, {
          total: processed.freeAgentEntries.length,
          credits: processed.creditCount,
          debits: processed.debitCount,
          totalAmount: processed.totalAmount,
          netAmount: processed.netAmount,
        });
      } else {
        setError(data.message || "Failed to fetch transactions");
      }
    } catch (error) {
      console.error("Transaction fetch error:", error);
      setError("Error fetching transactions");
    } finally {
      setIsLoading(false);
    }
  };

  const syncToFreeAgent = async () => {
    if (!setupStatus.canSync || !processedData) {
      setError("Please ensure connections are ready and data is fetched");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use the ENHANCED sync endpoint with statement upload
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/freeagent/upload-ebay-statement`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          credentials: "include",
          body: JSON.stringify({
            transactions: processedData.freeAgentEntries.map((entry) => ({
              dated_on: entry.dated_on,
              amount: entry.amount,
              description: entry.description,
              reference: entry.reference,
            })),
            // The bank account will be determined by the backend
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        const uploadedCount =
          data.data?.uploadedCount || processedData.freeAgentEntries.length;
        setSyncStatus(
          `Statement upload successful! ${uploadedCount} transactions uploaded with enhanced descriptions using FreeAgent's statement import method.`
        );
        setProcessedData(null); // Clear after successful sync
      } else {
        let errorMessage = "Sync failed";
        if (data.message?.includes("authentication")) {
          errorMessage =
            "FreeAgent authentication failed. Please reconnect your FreeAgent account.";
        } else if (data.message?.includes("validation")) {
          errorMessage =
            "Invalid transaction data. Please check your transactions and try again.";
        } else {
          errorMessage = data.message || "Unknown sync error occurred";
        }
        setError(errorMessage);
      }
    } catch (error) {
      console.error("Sync error:", error);
      setError(
        "Network error during sync. Please check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCsv = () => {
    if (!processedData) return;

    const csvContent = processedData.freeAgentEntries
      .map(
        (entry) =>
          `${entry.dated_on},${entry.amount},"${entry.description}","${
            entry.category
          }","${entry.reference || ""}"`
      )
      .join("\n");

    const header = "Date,Amount,Description,Category,Reference\n";
    const blob = new Blob([header + csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ebay-enhanced-transactions-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return {
    transactions,
    processedData,
    syncStatus,
    isLoading,
    error,
    setError,
    fetchTransactions,
    syncToFreeAgent,
    exportToCsv,
  };
};
