// hooks/useTransactionSync.js
import { useState } from "react";

export const useTransactionSync = (connections, setupStatus) => {
  const [transactions, setTransactions] = useState([]);
  const [processedData, setProcessedData] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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

        // Process for FreeAgent
        const processed = processTransactionsForFreeAgent(txns);
        setProcessedData(processed);

        setSyncStatus(`Fetched ${txns.length} transactions`);
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
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/freeagent/sync-transactions`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          credentials: "include",
          body: JSON.stringify({
            transactions: processedData.freeAgentEntries,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSyncStatus(
          `Successfully synced ${processedData.freeAgentEntries.length} transactions`
        );
        setProcessedData(null); // Clear after sync
      } else {
        setError(data.message || "Sync failed");
      }
    } catch (error) {
      console.error("Sync error:", error);
      setError("Network error during sync");
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCsv = () => {
    if (!processedData) return;

    const csvContent = processedData.freeAgentEntries
      .map(
        (entry) => `${entry.dated_on},${entry.amount},"${entry.description}"`
      )
      .join("\n");

    const header = "Date,Amount,Description\n";
    const blob = new Blob([header + csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ebay-transactions-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Simplified transaction processing (move complex logic here)
  const processTransactionsForFreeAgent = (transactions) => {
    const freeAgentEntries = transactions
      .map((txn) => ({
        dated_on: new Date(txn.transactionDate).toISOString().split("T")[0],
        amount: parseFloat(txn.amount?.value || 0),
        description: txn.transactionMemo || `eBay ${txn.transactionType}`,
        reference: txn.transactionId?.toString(),
      }))
      .filter((entry) => entry.amount !== 0);

    return {
      freeAgentEntries,
      totalAmount: freeAgentEntries.reduce(
        (sum, entry) => sum + Math.abs(entry.amount),
        0
      ),
      creditCount: freeAgentEntries.filter((e) => e.amount > 0).length,
      debitCount: freeAgentEntries.filter((e) => e.amount < 0).length,
    };
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
