import React, { useState, useEffect } from "react";

const EbayApiAccountingHelper = ({ user }) => {
  // Connection Status State (replaces manual config)
  const [connections, setConnections] = useState({
    ebay: { isConnected: false, environment: "production" },
    freeagent: { isConnected: false },
  });

  // Application State
  const [activeTab, setActiveTab] = useState("setup");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [selectedDateRange, setSelectedDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  // Processing State
  const [processedData, setProcessedData] = useState(null);

  // Check connection status on component mount
  useEffect(() => {
    if (user) {
      checkConnectionStatus();
    }
  }, [user]);

  // ===== BACKEND API FUNCTIONS =====

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const checkConnectionStatus = async () => {
    try {
      // Check eBay connection
      const ebayResponse = await fetch(
        `${process.env.REACT_APP_API_URL}/api/ebay/connection-status`,
        {
          headers: getAuthHeaders(),
          credentials: "include",
        }
      );

      if (ebayResponse.ok) {
        const ebayResponse_data = await ebayResponse.json();
        const ebayData = ebayResponse_data.data || ebayResponse_data; // Handle the nested data
        setConnections((prev) => ({
          ...prev,
          ebay: {
            isConnected: ebayData.isConnected, // ✅ Now correct
            environment: ebayData.environment || "production",
          },
        }));
      }

      // Check FreeAgent connection
      const freeagentResponse = await fetch(
        `${process.env.REACT_APP_API_URL}/api/freeagent/connection-status`,
        {
          headers: getAuthHeaders(),
          credentials: "include",
        }
      );

      if (freeagentResponse.ok) {
        const freeagentResponse_data = await freeagentResponse.json();
        const freeagentData =
          freeagentResponse_data.data || freeagentResponse_data;
        setConnections((prev) => ({
          ...prev,
          freeagent: {
            isConnected: freeagentData.isConnected, // ✅ Now correct
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
        // Backend handles the OAuth - redirect to eBay
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
        // Backend handles the OAuth - redirect to FreeAgent
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
      } else {
        setError("Failed to disconnect from FreeAgent");
      }
    } catch (error) {
      console.error("FreeAgent disconnect error:", error);
      setError("Error disconnecting from FreeAgent");
    }
  };

  const fetchTransactions = async () => {
    if (!connections.ebay.isConnected) {
      setError("Please connect to eBay first");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/ebay/transactions?startDate=${selectedDateRange.startDate}&endDate=${selectedDateRange.endDate}`,
        {
          headers: getAuthHeaders(),
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setTransactions(data.transactions || []);
        // Process data for FreeAgent
        const processed = processTransactionsForFreeAgent(
          data.transactions || []
        );
        setProcessedData(processed);
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

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/freeagent/bank-transactions`,
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
        alert(
          `Successfully synced ${
            data.count || processedData.freeAgentEntries.length
          } transactions to FreeAgent!`
        );
      } else {
        setError(data.message || "Failed to sync to FreeAgent");
      }
    } catch (error) {
      console.error("FreeAgent sync error:", error);
      setError("Error syncing to FreeAgent");
    } finally {
      setIsLoading(false);
    }
  };

  // ===== DATA PROCESSING =====

  const processTransactionsForFreeAgent = (ebayTransactions) => {
    if (!ebayTransactions || ebayTransactions.length === 0) {
      return { freeAgentEntries: [] };
    }

    const freeAgentEntries = ebayTransactions.map((txn) => ({
      date: new Date(txn.transactionDate).toISOString().split("T")[0],
      amount: parseFloat(txn.amount?.value || 0),
      description: `eBay ${txn.transactionType}: ${
        txn.references?.[0]?.title || "Transaction"
      }`,
      category: txn.transactionType === "SALE" ? "Sales" : "Refunds",
      reference: txn.orderId,
    }));

    return { freeAgentEntries };
  };

  // ===== EXPORT FUNCTIONS =====

  const exportToCsv = () => {
    if (!processedData) return;

    const csvContent = processedData.freeAgentEntries
      .map(
        (entry) =>
          `${entry.date},${entry.amount},"${entry.description}","${entry.category}"`
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

  // ===== UI COMPONENTS =====

  const renderSetupTab = () => (
    <div className="space-y-8">
      {/* eBay API Setup */}
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
                    Environment: {connections.ebay.environment}
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
                Securely connect your eBay account to fetch transaction data.
                Your credentials are encrypted and stored safely.
              </p>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Access to transaction history</li>
                <li>• Automatic data synchronization</li>
                <li>• Production eBay API integration</li>
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

      {/* FreeAgent API Setup */}
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
                    Ready to sync transactions
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={disconnectFreeAgent}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Disconnect FreeAgent
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">
                Connect Your FreeAgent Account
              </h4>
              <p className="text-green-800 text-sm mb-4">
                Connect FreeAgent to automatically create accounting entries
                from your eBay transactions.
              </p>
              <ul className="text-green-700 text-sm space-y-1">
                <li>• Automatic bank transaction creation</li>
                <li>• Categorized accounting entries</li>
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

      {/* System Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🚀 System Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-900">Backend Connected</p>
                <p className="text-blue-700 text-sm">Secure API proxy active</p>
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
        </div>
      </div>
    </div>
  );

  const renderImportTab = () => (
    <div className="space-y-6">
      {/* Date Range Selection */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Select Date Range
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedDateRange.startDate}
              onChange={(e) =>
                setSelectedDateRange((prev) => ({
                  ...prev,
                  startDate: e.target.value,
                }))
              }
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
              onChange={(e) =>
                setSelectedDateRange((prev) => ({
                  ...prev,
                  endDate: e.target.value,
                }))
              }
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
                disabled={!connections.freeagent.isConnected || isLoading}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Sync to FreeAgent ({processedData.freeAgentEntries.length})
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

        {/* Connection Requirements */}
        {(!connections.ebay.isConnected ||
          !connections.freeagent.isConnected) && (
          <div className="mt-6 bg-yellow-50 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2">
              Connection Required
            </h4>
            <p className="text-yellow-800 text-sm">
              {!connections.ebay.isConnected &&
              !connections.freeagent.isConnected
                ? "Connect both eBay and FreeAgent to sync transactions."
                : !connections.ebay.isConnected
                ? "Connect eBay to fetch transactions."
                : "Connect FreeAgent to sync transactions."}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderTransactionsTab = () => (
    <div className="space-y-6">
      {transactions.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            eBay Transactions ({transactions.length})
          </h3>
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
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((txn, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(txn.transactionDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {txn.transactionType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span
                        className={
                          txn.amount?.value > 0
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {txn.amount?.currencyCode} {txn.amount?.value}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {txn.references?.[0]?.title || "No description"}
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
            Connect to eBay and fetch transactions to see them here.
          </p>
        </div>
      )}
    </div>
  );

  const renderFreeAgentEntriesTab = () => (
    <div className="space-y-6">
      {processedData?.freeAgentEntries?.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            FreeAgent Entries ({processedData.freeAgentEntries.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
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
                      {entry.date}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {entry.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span
                        className={
                          entry.amount > 0 ? "text-green-600" : "text-red-600"
                        }
                      >
                        £{entry.amount}
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
            Fetch eBay transactions first to generate FreeAgent entries.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Error Display */}
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

        {/* Loading Overlay */}
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

        {/* Navigation Tabs */}
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

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === "setup" && renderSetupTab()}
          {activeTab === "import" && renderImportTab()}
          {activeTab === "transactions" && renderTransactionsTab()}
          {activeTab === "entries" && renderFreeAgentEntriesTab()}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🚀 Production Integration Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
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
                <div className="text-2xl">📊</div>
                <div className="font-medium text-gray-900">Transactions</div>
                <div className="text-gray-600">
                  {transactions.length} loaded
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>✅ Production Ready:</strong> Connected to secure
                backend with encrypted token storage, production eBay API
                integration, and full OAuth security.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EbayApiAccountingHelper;
