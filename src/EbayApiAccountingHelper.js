import React, { useState, useEffect } from "react";

const EbayApiAccountingHelper = () => {
  // API Configuration State
  const [ebayConfig, setEbayConfig] = useState({
    clientId: "",
    clientSecret: "",
    environment: "sandbox",
    authToken: "",
    isConnected: false,
  });

  const [freeAgentConfig, setFreeAgentConfig] = useState({
    clientId: "",
    clientSecret: "",
    accessToken: "",
    refreshToken: "",
    isConnected: false,
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

  // Check for OAuth callbacks on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");
    const error = urlParams.get("error");

    if (error) {
      setError(`OAuth error: ${error}`);
      return;
    }

    if (code && state) {
      const ebayState = localStorage.getItem("ebay_oauth_state");
      const freeAgentState = localStorage.getItem("freeagent_oauth_state");

      if (state === ebayState) {
        handleEbayCallback(code);
      } else if (state === freeAgentState) {
        handleFreeAgentCallback(code);
      } else {
        setError("OAuth state mismatch - please try connecting again");
      }
    }
  }, []);

  // ===== EBAY API FUNCTIONS =====

  const getEbayAuthUrl = () => {
    const scopes =
      "https://api.ebay.com/oauth/api_scope https://api.ebay.com/oauth/api_scope/sell.finances";
    // Use consistent redirect URI - must match what's configured in eBay Developer account
    const redirectUri = window.location.origin; // Just the base URL without path
    const state = Math.random().toString(36).substring(7);

    localStorage.setItem("ebay_oauth_state", state);

    const baseUrl =
      ebayConfig.environment === "sandbox"
        ? "https://auth.sandbox.ebay.com"
        : "https://auth.ebay.com";

    const authUrl =
      `${baseUrl}/oauth2/authorize?` +
      `client_id=${encodeURIComponent(ebayConfig.clientId)}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `state=${state}`;

    return authUrl;
  };

  const connectEbay = async () => {
    if (!ebayConfig.clientId || !ebayConfig.clientSecret) {
      setError("Please enter your eBay API credentials");
      return;
    }

    try {
      const authUrl = getEbayAuthUrl();
      window.location.href = authUrl; // Redirect to eBay OAuth
    } catch (err) {
      setError("Failed to connect to eBay: " + err.message);
    }
  };

  const handleEbayCallback = async (code) => {
    try {
      setIsLoading(true);
      const token = await exchangeEbayToken(code);

      setEbayConfig((prev) => ({
        ...prev,
        authToken: token,
        isConnected: true,
      }));

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      localStorage.removeItem("ebay_oauth_state");
    } catch (error) {
      setError("Failed to complete eBay authentication: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const exchangeEbayToken = async (code) => {
    try {
      const baseUrl =
        ebayConfig.environment === "sandbox"
          ? "https://api.sandbox.ebay.com"
          : "https://api.ebay.com";

      const response = await fetch(`${baseUrl}/identity/v1/oauth2/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(
            `${ebayConfig.clientId}:${ebayConfig.clientSecret}`
          )}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: code,
          redirect_uri: window.location.origin, // Match the same redirect URI used in auth
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Token exchange failed: ${
            errorData.error_description || response.status
          }`
        );
      }

      const tokenData = await response.json();
      return tokenData.access_token;
    } catch (error) {
      console.error("eBay token exchange error:", error);
      throw error;
    }
  };

  const fetchRealEbayTransactions = async () => {
    if (!ebayConfig.authToken) {
      setError("Please connect to eBay first");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const baseUrl =
        ebayConfig.environment === "sandbox"
          ? "https://apiz.sandbox.ebay.com"
          : "https://apiz.ebay.com";

      const startDate = new Date(selectedDateRange.startDate).toISOString();
      const endDate = new Date(selectedDateRange.endDate).toISOString();

      // Note: This will likely fail due to CORS.
      // In production, you'd need a backend proxy
      const response = await fetch(
        `${baseUrl}/sell/finances/v1/transaction?` +
          `filter=transactionDate:[${startDate}..${endDate}]&` +
          `limit=200&` +
          `sort=transactionDate`,
        {
          headers: {
            Authorization: `Bearer ${ebayConfig.authToken}`,
            "Content-Type": "application/json",
            "X-EBAY-C-MARKETPLACE-ID": "EBAY_GB",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `eBay API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      setTransactions(data.transactions || []);

      // Process data for FreeAgent
      const processed = processTransactionsForFreeAgent(
        data.transactions || []
      );
      setProcessedData(processed);
    } catch (err) {
      if (err.message.includes("CORS") || err.message.includes("cors")) {
        setError(
          "CORS Error: You need a backend proxy to call eBay API from browser. This is a browser security limitation."
        );
      } else {
        setError("Failed to fetch eBay transactions: " + err.message);
      }
      console.error("eBay API Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== FREEAGENT API FUNCTIONS =====

  const connectFreeAgent = async () => {
    if (!freeAgentConfig.clientId || !freeAgentConfig.clientSecret) {
      setError("Please enter your FreeAgent API credentials");
      return;
    }

    try {
      const redirectUri = window.location.origin + "/"; // Add trailing slash to match FreeAgent settings
      const state = Math.random().toString(36).substring(7);

      localStorage.setItem("freeagent_oauth_state", state);

      const authUrl =
        `https://api.freeagent.com/v2/approve_app?` +
        `client_id=${freeAgentConfig.clientId}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `state=${state}`;

      window.location.href = authUrl; // Redirect to FreeAgent OAuth
    } catch (err) {
      setError("Failed to connect to FreeAgent: " + err.message);
    }
  };

  const handleFreeAgentCallback = async (code) => {
    try {
      setIsLoading(true);
      const tokenData = await exchangeFreeAgentToken(code);

      setFreeAgentConfig((prev) => ({
        ...prev,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        isConnected: true,
      }));

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      localStorage.removeItem("freeagent_oauth_state");
    } catch (error) {
      setError("Failed to complete FreeAgent authentication: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const exchangeFreeAgentToken = async (code) => {
    try {
      // Debug: Check if credentials are actually in state
      console.log("FreeAgent Config State:", {
        clientId: freeAgentConfig.clientId,
        clientSecret: freeAgentConfig.clientSecret,
        clientIdLength: freeAgentConfig.clientId?.length,
        clientSecretLength: freeAgentConfig.clientSecret?.length,
      });

      if (!freeAgentConfig.clientId || !freeAgentConfig.clientSecret) {
        throw new Error(
          "FreeAgent credentials are missing from state. Please enter them in the form."
        );
      }

      // FreeAgent requires HTTP Basic Auth with client_id:client_secret
      const credentials = btoa(
        `${freeAgentConfig.clientId}:${freeAgentConfig.clientSecret}`
      );

      const requestData = {
        grant_type: "authorization_code",
        code: code,
        redirect_uri: window.location.origin + "/",
      };

      console.log(
        "FreeAgent token request - Basic Auth credentials for:",
        freeAgentConfig.clientId
      );
      console.log("FreeAgent token request data:", requestData);

      const response = await fetch(
        "https://api.freeagent.com/v2/token_endpoint",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${credentials}`, // HTTP Basic Auth required by FreeAgent
          },
          body: new URLSearchParams(requestData),
        }
      );

      console.log("FreeAgent token response status:", response.status);

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMessage =
            errorData.error_description || errorData.error || errorMessage;
          console.log("FreeAgent JSON error:", errorData);
        } else {
          const errorText = await response.text();
          console.log("FreeAgent error response:", errorText);
          errorMessage = `${errorMessage} - Check console for details`;
        }

        throw new Error(`Token exchange failed: ${errorMessage}`);
      }

      const tokenData = await response.json();
      console.log("FreeAgent token exchange successful");
      return tokenData;
    } catch (error) {
      console.error("FreeAgent token exchange error:", error);
      throw error;
    }
  };

  const syncToFreeAgent = async () => {
    if (!freeAgentConfig.accessToken || !processedData) {
      setError("Please connect to FreeAgent and fetch transactions first");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Note: This will also likely fail due to CORS
      for (const entry of processedData.freeAgentEntries) {
        const response = await fetch(
          "https://api.freeagent.com/v2/bank_transactions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${freeAgentConfig.accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              bank_transaction: {
                dated_on: entry.date,
                amount: entry.amount,
                description: entry.description,
                bank_account: "https://api.freeagent.com/v2/bank_accounts/1", // You'd need to specify actual account
              },
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`FreeAgent API error: ${response.status}`);
        }
      }

      alert("Transactions synced successfully to FreeAgent!");
    } catch (err) {
      if (err.message.includes("CORS") || err.message.includes("cors")) {
        setError(
          "CORS Error: You need a backend proxy to call FreeAgent API from browser."
        );
      } else {
        setError("Failed to sync to FreeAgent: " + err.message);
      }
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
            eBay API Configuration
          </h3>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              ebayConfig.isConnected
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {ebayConfig.isConnected ? "Connected" : "Not Connected"}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client ID
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={ebayConfig.clientId}
              onChange={(e) =>
                setEbayConfig((prev) => ({ ...prev, clientId: e.target.value }))
              }
              placeholder="Your-eBay-Client-ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client Secret
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={ebayConfig.clientSecret}
              onChange={(e) =>
                setEbayConfig((prev) => ({
                  ...prev,
                  clientSecret: e.target.value,
                }))
              }
              placeholder="Your-eBay-Client-Secret"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Environment
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={ebayConfig.environment}
            onChange={(e) =>
              setEbayConfig((prev) => ({
                ...prev,
                environment: e.target.value,
              }))
            }
          >
            <option value="sandbox">Sandbox (Testing)</option>
            <option value="production">Production (Live)</option>
          </select>
        </div>

        <button
          onClick={connectEbay}
          disabled={
            !ebayConfig.clientId ||
            !ebayConfig.clientSecret ||
            ebayConfig.isConnected
          }
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {ebayConfig.isConnected ? "Connected to eBay" : "Connect to eBay"}
        </button>
      </div>

      {/* FreeAgent API Setup */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            FreeAgent API Configuration
          </h3>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              freeAgentConfig.isConnected
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {freeAgentConfig.isConnected ? "Connected" : "Not Connected"}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client ID
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              value={freeAgentConfig.clientId}
              onChange={(e) => {
                console.log("FreeAgent Client ID changed to:", e.target.value);
                setFreeAgentConfig((prev) => ({
                  ...prev,
                  clientId: e.target.value,
                }));
              }}
              onInput={(e) => {
                console.log("FreeAgent Client ID input to:", e.target.value);
                setFreeAgentConfig((prev) => ({
                  ...prev,
                  clientId: e.target.value,
                }));
              }}
              placeholder="L7XkhS83nfcJ2MEc1wRBGQ"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client Secret
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              value={freeAgentConfig.clientSecret}
              onChange={(e) => {
                console.log(
                  "FreeAgent Client Secret changed to:",
                  e.target.value
                );
                setFreeAgentConfig((prev) => ({
                  ...prev,
                  clientSecret: e.target.value,
                }));
              }}
              onInput={(e) => {
                console.log(
                  "FreeAgent Client Secret input to:",
                  e.target.value
                );
                setFreeAgentConfig((prev) => ({
                  ...prev,
                  clientSecret: e.target.value,
                }));
              }}
              placeholder="JuGKlgFAGUBCOwA2y4F_XA"
            />
          </div>
        </div>

        {/* Quick Fix Button */}
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 mb-2">
            <strong>Quick Fix:</strong> If the form inputs aren't working, click
            this button to set your credentials:
          </p>
          <button
            onClick={() => {
              setFreeAgentConfig((prev) => ({
                ...prev,
                clientId: "L7XkhS83nfcJ2MEc1wRBGQ",
                clientSecret: "JuGKlgFAGUBCOwA2y4F_XA",
              }));
              console.log("FreeAgent credentials set via button");
            }}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm"
          >
            Set FreeAgent Credentials
          </button>
        </div>

        <button
          onClick={connectFreeAgent}
          disabled={
            !freeAgentConfig.clientId ||
            !freeAgentConfig.clientSecret ||
            freeAgentConfig.isConnected
          }
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {freeAgentConfig.isConnected
            ? "Connected to FreeAgent"
            : "Connect to FreeAgent"}
        </button>
      </div>

      {/* CORS Warning */}
      <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-6">
        <h3 className="text-lg font-semibold text-yellow-900 mb-4">
          ⚠️ Important: CORS Limitations
        </h3>
        <div className="space-y-3 text-sm text-yellow-800">
          <div>
            Due to browser security (CORS policy), direct API calls to eBay and
            FreeAgent will likely fail.
          </div>
          <div>
            <strong>For production use, you need:</strong>
          </div>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>A backend server to proxy API calls</li>
            <li>Server-side OAuth handling</li>
            <li>Proper API credentials management</li>
          </ul>
          <div>
            This frontend demonstrates the OAuth flow and data processing logic.
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

        <div className="flex space-x-4 mt-6">
          <button
            onClick={fetchRealEbayTransactions}
            disabled={!ebayConfig.isConnected || isLoading}
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

          {processedData && (
            <button
              onClick={syncToFreeAgent}
              disabled={!freeAgentConfig.isConnected || isLoading}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Sync to FreeAgent
            </button>
          )}

          {processedData && (
            <button
              onClick={exportToCsv}
              className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              Export CSV
            </button>
          )}
        </div>
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
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            eBay API Accounting Helper - LIVE VERSION
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Real API integration with eBay Finances API and FreeAgent API
          </p>
        </div>

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
                <h3 className="text-sm font-medium text-red-800">API Error</h3>
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
                Processing API request...
              </span>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8 justify-center">
            {[
              { id: "setup", label: "API Setup", icon: "⚙️" },
              { id: "import", label: "Import & Sync", icon: "📥" },
              { id: "transactions", label: "Real Transactions", icon: "📊" },
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
              🚀 Live API Integration Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
              <div className="flex flex-col items-center space-y-2">
                <div className="text-2xl">🔗</div>
                <div className="font-medium text-gray-900">eBay Connection</div>
                <div
                  className={`px-2 py-1 rounded text-xs ${
                    ebayConfig.isConnected
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {ebayConfig.isConnected ? "Connected" : "Not Connected"}
                </div>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <div className="text-2xl">💰</div>
                <div className="font-medium text-gray-900">
                  FreeAgent Connection
                </div>
                <div
                  className={`px-2 py-1 rounded text-xs ${
                    freeAgentConfig.isConnected
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {freeAgentConfig.isConnected ? "Connected" : "Not Connected"}
                </div>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <div className="text-2xl">📊</div>
                <div className="font-medium text-gray-900">Transactions</div>
                <div className="text-gray-600">
                  {transactions.length} fetched
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">
                <strong>Note:</strong> This application requires a backend
                server for production use due to CORS policies. The OAuth flows
                and data processing logic are fully functional for demonstration
                purposes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EbayApiAccountingHelper;
