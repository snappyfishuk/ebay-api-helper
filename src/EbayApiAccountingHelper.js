// SECTION 1: IMPORTS AND INITIAL STATE
import React, { useState, useEffect } from "react";
import AccountInfo from "./components/AccountInfo";

const EbayApiAccountingHelper = ({ user }) => {
  // Connection Status State
  const [connections, setConnections] = useState({
    ebay: { isConnected: false, environment: "production" },
    freeagent: { isConnected: false },
  });

  // Enhanced state with availableEbayAccounts
  const [ebayAccountStatus, setEbayAccountStatus] = useState({
    hasEbayAccount: false,
    autoCreated: false,
    needsSetup: true,
    bankAccount: null,
  });

  // NEW: Add this state variable for existing eBay accounts
  const [availableEbayAccounts, setAvailableEbayAccounts] = useState([]);

  const [setupStatus, setSetupStatus] = useState({
    ebayConnected: false,
    freeagentConnected: false,
    ebayAccountReady: false,
    readyToSync: false,
  });

  // Application State
  const [activeTab, setActiveTab] = useState("setup");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [selectedDateRange, setSelectedDateRange] = useState(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      startDate: thirtyDaysAgo.toISOString().split("T")[0],
      endDate: today.toISOString().split("T")[0],
    };
  });

  // Processing State
  const [processedData, setProcessedData] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);

  // SECTION 2: VALIDATION FUNCTIONS
  const validateDateRange = (startDate, endDate) => {
    const today = new Date().toISOString().split("T")[0];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const todayDate = new Date(today);

    if (start > end) {
      return { isValid: false, error: "Start date cannot be after end date" };
    }

    if (start > todayDate || end > todayDate) {
      return { isValid: false, error: "Dates cannot be in the future" };
    }

    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (daysDiff > 90) {
      return { isValid: false, error: "Date range cannot exceed 90 days" };
    }

    return { isValid: true };
  };

  const handleStartDateChange = (e) => {
    const newStartDate = e.target.value;
    const validation = validateDateRange(
      newStartDate,
      selectedDateRange.endDate
    );

    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    setError(null);
    setSelectedDateRange((prev) => ({ ...prev, startDate: newStartDate }));
  };

  const handleEndDateChange = (e) => {
    const newEndDate = e.target.value;
    const validation = validateDateRange(
      selectedDateRange.startDate,
      newEndDate
    );

    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    setError(null);
    setSelectedDateRange((prev) => ({ ...prev, endDate: newEndDate }));
  };

  const setDatePreset = (days) => {
    const today = new Date();
    const pastDate = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);

    setSelectedDateRange({
      startDate: pastDate.toISOString().split("T")[0],
      endDate: today.toISOString().split("T")[0],
    });
    setError(null);
  };

  // SECTION 3: useEffect HOOKS AND HELPER FUNCTIONS
  // useEffect Hooks
  useEffect(() => {
    if (user) {
      checkConnectionStatus();
    }
  }, [user]);

  useEffect(() => {
    if (connections.freeagent.isConnected) {
      checkEbayAccountStatus();
    }
    updateSetupStatus();
  }, [
    connections.freeagent.isConnected,
    connections.ebay.isConnected,
    ebayAccountStatus.hasEbayAccount,
  ]);

  // Helper Functions
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const updateSetupStatus = () => {
    setSetupStatus({
      ebayConnected: connections.ebay.isConnected,
      freeagentConnected: connections.freeagent.isConnected,
      ebayAccountReady: ebayAccountStatus.hasEbayAccount,
      readyToSync:
        connections.ebay.isConnected &&
        connections.freeagent.isConnected &&
        ebayAccountStatus.hasEbayAccount,
    });
  };

  // SECTION 4: ENHANCED BACKEND INTEGRATION FUNCTIONS
  // UPDATED: Enhanced FreeAgent Integration Functions
  const checkEbayAccountStatus = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/freeagent/ebay-account-status`,
        {
          headers: getAuthHeaders(),
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setEbayAccountStatus(data.data);

        // Store available accounts for potential selection
        if (
          data.data.availableEbayAccounts &&
          data.data.availableEbayAccounts.length > 0
        ) {
          setAvailableEbayAccounts(data.data.availableEbayAccounts);
        }
      }
    } catch (error) {
      console.error("Error checking eBay account status:", error);
    }
  };

  const createEbayAccount = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/freeagent/create-ebay-account`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          credentials: "include",
          body: JSON.stringify({
            confirmCreate: "true",
            accountName: "eBay Sales",
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setEbayAccountStatus({
          hasEbayAccount: true,
          autoCreated: data.data.created,
          needsSetup: false,
          bankAccount: data.data.bankAccount,
        });

        // Clear available accounts since we now have a selected one
        setAvailableEbayAccounts([]);
      } else {
        throw new Error(data.message || "Failed to set up eBay account");
      }
    } catch (error) {
      console.error("Error setting up eBay account:", error);
      setError("Failed to set up eBay account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const selectExistingEbayAccount = async (accountUrl) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/freeagent/select-ebay-account`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          credentials: "include",
          body: JSON.stringify({ accountUrl }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setEbayAccountStatus({
          hasEbayAccount: true,
          autoCreated: false,
          needsSetup: false,
          bankAccount: data.data.bankAccount,
        });

        // Clear available accounts since we now have a selected one
        setAvailableEbayAccounts([]);
      } else {
        throw new Error(data.message || "Failed to select eBay account");
      }
    } catch (error) {
      console.error("Error selecting eBay account:", error);
      setError("Failed to select eBay account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // SECTION 6: BACKEND API FUNCTIONS
  const checkConnectionStatus = async () => {
    try {
      const ebayResponse = await fetch(
        `${process.env.REACT_APP_API_URL}/api/ebay/connection-status`,
        {
          headers: getAuthHeaders(),
          credentials: "include",
        }
      );

      if (ebayResponse.ok) {
        const ebayData = await ebayResponse.json();
        setConnections((prev) => ({
          ...prev,
          ebay: {
            isConnected: ebayData.data?.isConnected || ebayData.isConnected,
            environment:
              ebayData.data?.environment ||
              ebayData.environment ||
              "production",
          },
        }));
      }

      const freeagentResponse = await fetch(
        `${process.env.REACT_APP_API_URL}/api/freeagent/connection-status`,
        {
          headers: getAuthHeaders(),
          credentials: "include",
        }
      );

      if (freeagentResponse.ok) {
        const freeagentData = await freeagentResponse.json();
        setConnections((prev) => ({
          ...prev,
          freeagent: {
            isConnected:
              freeagentData.data?.isConnected || freeagentData.isConnected,
          },
        }));
      }
    } catch (error) {
      console.error("Error checking connection status:", error);
    }
  };

  const connectToEbay = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/ebay/auth-url?environment=production`,
        {
          headers: getAuthHeaders(),
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok && data.status === "success") {
        window.location.href = data.data.authUrl;
      } else {
        setError(data.message || "Failed to connect to eBay");
      }
    } catch (error) {
      console.error("eBay connection error:", error);
      setError("Error connecting to eBay");
    } finally {
      setIsLoading(false);
    }
  };

  const connectToFreeAgent = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/freeagent/auth-url`,
        {
          headers: getAuthHeaders(),
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok && data.status === "success") {
        window.location.href = data.data.authUrl;
      } else {
        setError(data.message || "Failed to connect to FreeAgent");
      }
    } catch (error) {
      console.error("FreeAgent connection error:", error);
      setError("Error connecting to FreeAgent");
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectEbay = async () => {
    try {
      setError(null);
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/ebay/disconnect`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
          credentials: "include",
        }
      );

      if (response.ok) {
        setConnections((prev) => ({
          ...prev,
          ebay: { isConnected: false, environment: "production" },
        }));
        setTransactions([]);
        setProcessedData(null);
      } else {
        setError("Failed to disconnect from eBay");
      }
    } catch (error) {
      console.error("eBay disconnect error:", error);
      setError("Error disconnecting from eBay");
    }
  };

  const disconnectFreeAgent = async () => {
    try {
      setError(null);
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/freeagent/disconnect`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
          credentials: "include",
        }
      );

      if (response.ok) {
        setConnections((prev) => ({
          ...prev,
          freeagent: { isConnected: false },
        }));
        setEbayAccountStatus({
          hasEbayAccount: false,
          autoCreated: false,
          needsSetup: true,
          bankAccount: null,
        });
      } else {
        setError("Failed to disconnect from FreeAgent");
      }
    } catch (error) {
      console.error("FreeAgent disconnect error:", error);
      setError("Error disconnecting from FreeAgent");
    }
  };

  // SECTION 7: TRANSACTION FETCHING AND SYNCING
  const fetchTransactions = async () => {
    if (!connections.ebay.isConnected) {
      setError("Please connect to eBay first");
      return;
    }

    const validation = validateDateRange(
      selectedDateRange.startDate,
      selectedDateRange.endDate
    );
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(
        `Fetching transactions from ${selectedDateRange.startDate} to ${selectedDateRange.endDate}`
      );

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/ebay/transactions?startDate=${selectedDateRange.startDate}&endDate=${selectedDateRange.endDate}`,
        {
          headers: getAuthHeaders(),
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setTransactions(data.data?.transactions || []);
        const processed = processTransactionsForFreeAgent(
          data.data?.transactions || []
        );
        setProcessedData(processed);
        setSyncStatus(
          `Fetched ${
            data.data?.transactions?.length || 0
          } transactions from eBay ${data.data?.environment || "production"}`
        );

        console.log(`Processed data:`, {
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
    if (!connections.freeagent.isConnected || !processedData) {
      setError("Please connect to FreeAgent and fetch transactions first");
      return;
    }

    if (!ebayAccountStatus.hasEbayAccount) {
      setError("Please set up your eBay account first");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get bank account ID from the eBay account
      const bankAccountId = ebayAccountStatus.bankAccount.url.split("/").pop();

      // Convert processed data to statement upload format
      const syncData = {
        transactions: processedData.freeAgentEntries.map((entry) => ({
          dated_on: entry.dated_on,
          amount: entry.amount,
          description: entry.description,
          reference: entry.reference,
        })),
        bankAccountId: bankAccountId,
      };

      console.log("Syncing with statement upload method:", syncData);

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/freeagent/upload-ebay-statement`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          credentials: "include",
          body: JSON.stringify(syncData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        const uploadedCount =
          data.data?.uploadedCount || processedData.freeAgentEntries.length;

        setSyncStatus(
          `Statement upload successful! ${uploadedCount} transactions uploaded to ${
            ebayAccountStatus.bankAccount?.name || "eBay Sales account"
          } using FreeAgent's statement import method.`
        );

        // Clear the processed data since sync is complete
        setProcessedData(null);
      } else {
        let errorMessage = "Sync failed";

        if (data.status === "error") {
          if (data.message?.includes("authentication")) {
            errorMessage =
              "FreeAgent authentication failed. Please reconnect your FreeAgent account.";
          } else if (data.message?.includes("validation")) {
            errorMessage =
              "Invalid transaction data. Please check your transactions and try again.";
          } else {
            errorMessage = data.message || "Unknown sync error occurred";
          }
        }

        setError(errorMessage);
        setSyncStatus(null);
      }
    } catch (error) {
      console.error("Statement upload error:", error);
      setError(
        "Network error during sync. Please check your connection and try again."
      );
      setSyncStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  // SECTION 8: DATA PROCESSING FUNCTIONS
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

  const formatUKDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const exportToCsv = () => {
    if (!processedData) return;

    const csvContent = processedData.freeAgentEntries
      .map(
        (entry) =>
          `${entry.dated_on},${entry.amount},"${entry.description}","${entry.category}"`
      )
      .join("\n");

    const header = "Date,Amount,Description,Category\n";
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

  // SECTION 9: ENHANCED STREAMLINED FREEAGENT SECTION COMPONENT
  const StreamlinedFreeAgentSection = () => {
    const [creatingAccount, setCreatingAccount] = useState(false);

    // Determine what UI to show based on account status
    const hasMultipleEbayAccounts = availableEbayAccounts.length > 1;
    const needsAccountSelection =
      !ebayAccountStatus.hasEbayAccount && availableEbayAccounts.length > 0;

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            FreeAgent Integration
          </h3>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              connections.freeagent.isConnected
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {connections.freeagent.isConnected ? "Connected" : "Not Connected"}
          </div>
        </div>

        {connections.freeagent.isConnected ? (
          <div className="space-y-4">
            {/* Success Message */}
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 text-green-400 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-green-800 font-medium">
                    FreeAgent Connected Successfully
                  </p>
                  <p className="text-green-600 text-sm">
                    Ready for automated eBay transaction sync
                  </p>
                </div>
              </div>
            </div>

            {/* eBay Account Setup */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-3">
                eBay Sales Account
              </h4>

              {ebayAccountStatus.hasEbayAccount ? (
                /* Account Ready State */
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <svg
                      className="h-4 w-4 text-green-500 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="font-medium text-green-800">
                      {ebayAccountStatus.bankAccount?.name || "eBay Sales"}{" "}
                      account ready
                    </span>
                  </div>
                  <p className="text-blue-700 text-sm">
                    All eBay transactions will sync to this dedicated account
                    for clean organization
                  </p>
                  {ebayAccountStatus.autoCreated && (
                    <p className="text-blue-600 text-xs">
                      ✨ New account created following FreeAgent best practices
                    </p>
                  )}
                  {!ebayAccountStatus.autoCreated && (
                    <p className="text-blue-600 text-xs">
                      ✅ Using your existing eBay account safely
                    </p>
                  )}
                </div>
              ) : needsAccountSelection ? (
                /* Account Selection State */
                <div className="space-y-3">
                  <p className="text-blue-800 text-sm font-medium">
                    Found {availableEbayAccounts.length} existing eBay account
                    {availableEbayAccounts.length > 1 ? "s" : ""}. Please select
                    which one to use:
                  </p>
                  <div className="space-y-2">
                    {availableEbayAccounts.map((account) => (
                      <button
                        key={account.id}
                        onClick={() =>
                          selectExistingEbayAccount(account.apiUrl)
                        }
                        disabled={isLoading}
                        className="w-full text-left p-3 border border-blue-200 rounded-md hover:bg-blue-100 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                      >
                        <div className="font-medium text-blue-900">
                          {account.name}
                        </div>
                        <div className="text-sm text-blue-700">
                          {account.type} • {account.currency}
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-yellow-800 text-xs">
                      Safe mode: We found existing eBay accounts and will never
                      create duplicates. Select one above to continue.
                    </p>
                  </div>
                </div>
              ) : (
                /* Account Creation State */
                <div className="space-y-3">
                  <p className="text-blue-800 text-sm">
                    We'll create a dedicated "eBay Sales" bank account in
                    FreeAgent for clean transaction organization.
                  </p>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• Follows FreeAgent's Amazon module pattern</li>
                    <li>
                      • Keeps eBay transactions separate from other business
                      accounts
                    </li>
                    <li>• Safe creation - only if no eBay accounts exist</li>
                    <li>• No risk of duplicating existing accounts</li>
                  </ul>
                  <button
                    onClick={async () => {
                      setCreatingAccount(true);
                      await createEbayAccount();
                      setCreatingAccount(false);
                    }}
                    disabled={creatingAccount || isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors text-sm flex items-center space-x-2"
                  >
                    {(creatingAccount || isLoading) && (
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    )}
                    <span>
                      {creatingAccount
                        ? "Setting Up Account..."
                        : isLoading
                        ? "Loading..."
                        : "Set Up eBay Sales Account"}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Disconnect Button */}
            <button
              onClick={disconnectFreeAgent}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Disconnect FreeAgent
            </button>
          </div>
        ) : (
          /* Not Connected State */
          <div className="space-y-4">
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">
                Connect Your FreeAgent Account
              </h4>
              <p className="text-green-800 text-sm mb-4">
                Safe setup that works with your existing eBay accounts or
                creates one only if needed.
              </p>
              <ul className="text-green-700 text-sm space-y-1">
                <li>• Works with existing eBay accounts safely</li>
                <li>• No risk of deleting or duplicating accounts</li>
                <li>• Clean separation of eBay transactions</li>
                <li>• Enhanced transaction descriptions</li>
                <li>• Secure OAuth connection</li>
              </ul>
            </div>
            <button
              onClick={connectToFreeAgent}
              disabled={isLoading}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Connecting..." : "Connect to FreeAgent"}
            </button>
          </div>
        )}
      </div>
    );
  };

  // SECTION 10: SETUP PROGRESS COMPONENT
  const SetupProgress = () => {
    const steps = [
      {
        name: "Connect eBay",
        completed: setupStatus.ebayConnected,
        description: "Link your eBay account",
      },
      {
        name: "Connect FreeAgent",
        completed: setupStatus.freeagentConnected,
        description: "Link your FreeAgent account",
      },
      {
        name: "Setup eBay Account",
        completed: setupStatus.ebayAccountReady,
        description: "Auto-create dedicated account",
      },
    ];

    return (
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Setup Progress
        </h3>
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={step.name} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mr-4 ${
                  step.completed
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {step.completed ? (
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <div className="flex-1">
                <div
                  className={`font-medium ${
                    step.completed ? "text-green-700" : "text-gray-700"
                  }`}
                >
                  {step.name}
                </div>
                <div className="text-sm text-gray-500">{step.description}</div>
              </div>
            </div>
          ))}
        </div>

        {setupStatus.readyToSync && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <svg
                className="h-5 w-5 text-green-400 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-green-800 font-medium">Ready to Sync!</p>
                <p className="text-green-600 text-sm">
                  All setup complete. You can now fetch and sync transactions.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // SECTION 11: RENDER FUNCTIONS - renderSetupTab
  const renderSetupTab = () => (
    <div className="space-y-8">
      {/* eBay Integration Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            eBay Integration
          </h3>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              connections.ebay.isConnected
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {connections.ebay.isConnected ? "Connected" : "Not Connected"}
          </div>
        </div>

        {connections.ebay.isConnected ? (
          <div className="space-y-4">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 text-green-400 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-green-800 font-medium">
                    eBay Connected Successfully
                  </p>
                  <p className="text-green-600 text-sm">
                    Environment: {connections.ebay.environment} | Enhanced
                    descriptions active
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={disconnectEbay}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Disconnect eBay
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">
                Connect Your eBay Account
              </h4>
              <p className="text-blue-800 text-sm mb-4">
                Securely connect your eBay account to fetch transaction data
                with enhanced descriptions.
              </p>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>
                  • Enhanced transaction descriptions using eBay's rich data
                </li>
                <li>• Uses transaction memos and reference information</li>
                <li>
                  • Production eBay API integration with RFC 9421 signatures
                </li>
                <li>
                  • Individual account isolation - your data stays private
                </li>
              </ul>
            </div>
            <button
              onClick={connectToEbay}
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Connecting..." : "Connect to eBay"}
            </button>
          </div>
        )}
      </div>

      {/* Enhanced StreamlinedFreeAgentSection */}
      <StreamlinedFreeAgentSection />

      {/* Setup Progress */}
      {!setupStatus.readyToSync && <SetupProgress />}

      {/* System Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          System Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-900">Backend Connected</p>
                <p className="text-blue-700 text-sm">
                  Enhanced processing active
                </p>
              </div>
              <div className="h-3 w-3 bg-green-400 rounded-full"></div>
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-purple-900">
                  User Authenticated
                </p>
                <p className="text-purple-700 text-sm">{user?.email}</p>
              </div>
              <div className="h-3 w-3 bg-green-400 rounded-full"></div>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-green-900">Setup Complete</p>
                <p className="text-green-700 text-sm">
                  {setupStatus.readyToSync ? "Ready to sync" : "Setup required"}
                </p>
              </div>
              <div
                className={`h-3 w-3 rounded-full ${
                  setupStatus.readyToSync ? "bg-green-400" : "bg-yellow-400"
                }`}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // SECTION 12: renderImportTab FUNCTION
  const renderImportTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Select Date Range
        </h3>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setDatePreset(7)}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
          >
            Last 7 days
          </button>
          <button
            onClick={() => setDatePreset(30)}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
          >
            Last 30 days
          </button>
          <button
            onClick={() => setDatePreset(90)}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
          >
            Last 90 days
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedDateRange.startDate}
              onChange={handleStartDateChange}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedDateRange.endDate}
              onChange={handleEndDateChange}
              max={new Date().toISOString().split("T")[0]}
              min={selectedDateRange.startDate}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mt-6">
          <button
            onClick={fetchTransactions}
            disabled={!connections.ebay.isConnected || isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isLoading && (
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            )}
            <span>{isLoading ? "Fetching..." : "Fetch eBay Transactions"}</span>
          </button>

          {processedData && processedData.freeAgentEntries.length > 0 && (
            <>
              <button
                onClick={syncToFreeAgent}
                disabled={!setupStatus.readyToSync || isLoading}
                className={`px-6 py-2 rounded-md transition-colors flex items-center space-x-2 ${
                  setupStatus.readyToSync
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-gray-400 text-white cursor-not-allowed"
                }`}
              >
                <span>
                  Upload to eBay Sales Account (
                  {processedData.freeAgentEntries.length})
                </span>
                {setupStatus.readyToSync && (
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
              <button
                onClick={exportToCsv}
                className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                Export CSV
              </button>
            </>
          )}
        </div>

        {!setupStatus.readyToSync && (
          <div className="mt-6 bg-yellow-50 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2">Setup Required</h4>
            <p className="text-yellow-800 text-sm">
              {(() => {
                const missing = [];
                if (!connections.ebay.isConnected) missing.push("Connect eBay");
                if (!connections.freeagent.isConnected)
                  missing.push("Connect FreeAgent");
                if (!ebayAccountStatus.hasEbayAccount)
                  missing.push("Set up eBay account");
                return `Please complete: ${missing.join(", ")}.`;
              })()}
            </p>
          </div>
        )}

        {setupStatus.readyToSync && ebayAccountStatus.hasEbayAccount && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <svg
                className="h-5 w-5 text-green-400 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-green-800 font-medium">Ready to Sync</p>
                <p className="text-green-600 text-sm">
                  Transactions will sync to:{" "}
                  <strong>
                    {ebayAccountStatus.bankAccount?.name || "eBay Sales"}
                  </strong>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {syncStatus && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg
              className="h-5 w-5 text-blue-400 mr-3"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-blue-800 font-medium">Sync Status</p>
              <p className="text-blue-700 text-sm">{syncStatus}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // SECTION 13: renderTransactionsTab FUNCTION
  const renderTransactionsTab = () => (
    <div className="space-y-6">
      {transactions.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              eBay Transactions ({transactions.length})
            </h3>
            <div className="bg-blue-100 px-3 py-1 rounded-full text-sm font-medium text-blue-800">
              Enhanced Descriptions
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enhanced Description
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((txn, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatUKDate(txn.transactionDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {formatTransactionType(txn.transactionType)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span
                        className={
                          determineIfDebit(
                            txn,
                            parseFloat(txn.amount?.value || 0)
                          )
                            ? "text-red-600"
                            : "text-green-600"
                        }
                      >
                        {txn.amount?.currencyCode}{" "}
                        {Math.abs(txn.amount?.value || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div
                        className="max-w-xs truncate font-medium"
                        title={generateEnhancedTransactionDescription(txn)}
                      >
                        {generateEnhancedTransactionDescription(txn)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-gray-400 text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Transactions Found
          </h3>
          <p className="text-gray-600">
            Connect to eBay and fetch transactions to see enhanced descriptions
            here.
          </p>
        </div>
      )}
    </div>
  );

  // SECTION 14: renderFreeAgentEntriesTab FUNCTION
  const renderFreeAgentEntriesTab = () => (
    <div className="space-y-6">
      {processedData?.freeAgentEntries?.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Enhanced FreeAgent Entries (
              {processedData.freeAgentEntries.length})
            </h3>
            <div className="flex items-center space-x-2">
              <div className="bg-green-100 px-3 py-1 rounded-full text-sm font-medium text-green-800">
                Ready for Sync
              </div>
              {ebayAccountStatus.hasEbayAccount && (
                <div className="bg-blue-100 px-3 py-1 rounded-full text-sm font-medium text-blue-800">
                  → {ebayAccountStatus.bankAccount?.name || "eBay Sales"}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">
                {processedData.freeAgentEntries.length}
              </div>
              <div className="text-blue-800 text-sm">Total Transactions</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                {processedData.creditCount}
              </div>
              <div className="text-green-800 text-sm">Credits (Income)</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-600">
                {processedData.debitCount}
              </div>
              <div className="text-red-800 text-sm">Debits (Fees/Refunds)</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enhanced Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {processedData.freeAgentEntries.map((entry, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatUKDate(entry.dated_on)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <div
                        className="truncate font-medium"
                        title={entry.description}
                      >
                        {entry.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                        {entry.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          entry.isDebit
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {entry.isDebit ? "Debit" : "Credit"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span
                        className={
                          entry.isDebit ? "text-red-600" : "text-green-600"
                        }
                      >
                        {entry.isDebit ? "-" : "+"}£{Math.abs(entry.amount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-gray-400 text-4xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Entries Generated
          </h3>
          <p className="text-gray-600">
            Fetch eBay transactions first to generate enhanced FreeAgent
            entries.
          </p>
        </div>
      )}
    </div>
  );

  // SECTION 15: MAIN COMPONENT RETURN AND EXPORT
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <AccountInfo />

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
                <div className="mt-4">
                  <button
                    onClick={() => setError(null)}
                    className="text-sm text-red-800 hover:text-red-600 font-medium"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center">
              <svg
                className="animate-spin h-5 w-5 text-blue-600 mr-3"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span className="text-blue-800 font-medium">
                Processing request...
              </span>
            </div>
          </div>
        )}

        <div className="mb-8">
          <nav className="flex space-x-8 justify-center">
            {[
              { id: "setup", label: "Connections", icon: "🔗" },
              { id: "import", label: "Import & Sync", icon: "📥" },
              { id: "transactions", label: "Transactions", icon: "📊" },
              { id: "entries", label: "FreeAgent Entries", icon: "📋" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="tab-content">
          {activeTab === "setup" && renderSetupTab()}
          {activeTab === "import" && renderImportTab()}
          {activeTab === "transactions" && renderTransactionsTab()}
          {activeTab === "entries" && renderFreeAgentEntriesTab()}
        </div>

        {/* Footer Status Section */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Streamlined Production Integration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm text-gray-600">
              <div className="flex flex-col items-center space-y-2">
                <div className="text-2xl">🔗</div>
                <div className="font-medium text-gray-900">eBay Connection</div>
                <div
                  className={`px-2 py-1 rounded text-xs ${
                    connections.ebay.isConnected
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {connections.ebay.isConnected ? "Connected" : "Not Connected"}
                </div>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <div className="text-2xl">💰</div>
                <div className="font-medium text-gray-900">
                  FreeAgent Connection
                </div>
                <div
                  className={`px-2 py-1 rounded text-xs ${
                    connections.freeagent.isConnected
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {connections.freeagent.isConnected
                    ? "Connected"
                    : "Not Connected"}
                </div>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <div className="text-2xl">🏦</div>
                <div className="font-medium text-gray-900">eBay Account</div>
                <div
                  className={`px-2 py-1 rounded text-xs ${
                    ebayAccountStatus.hasEbayAccount
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {ebayAccountStatus.hasEbayAccount
                    ? "Ready"
                    : "Setup Required"}
                </div>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <div className="text-2xl">📊</div>
                <div className="font-medium text-gray-900">Enhanced Data</div>
                <div className="text-gray-600">
                  {transactions.length} transactions with rich descriptions
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>Streamlined Setup:</strong> Auto-creates dedicated eBay
                Sales account, eliminates manual bank account selection, follows
                FreeAgent best practices. Each user connects their own eBay
                account for complete data isolation.
              </p>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-center space-x-2">
                <span className="text-sm font-medium text-gray-700">
                  Setup Status:
                </span>
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    setupStatus.readyToSync
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {setupStatus.readyToSync ? "Ready to Sync" : "Setup Required"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EbayApiAccountingHelper;
