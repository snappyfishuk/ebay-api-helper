import React, { useState, useEffect } from "react";

const EbayApiAccountingHelper = ({ user }) => {
  // Connection Status State
  const [connections, setConnections] = useState({
    ebay: { isConnected: false, environment: "production" },
    freeagent: { isConnected: false },
  });

  // Enhanced state for bank account selection and eBay contact
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedBankAccount, setSelectedBankAccount] = useState("");
  const [ebayContact, setEbayContact] = useState(null);
  const [syncSettings, setSyncSettings] = useState({
    preferredBankAccount: null,
    ebayContactUrl: null,
    autoCreateEbayContact: true,
    defaultTransactionDescription: "eBay Transaction"
  });
  const [setupStatus, setSetupStatus] = useState({
    ebayConnected: false,
    freeagentConnected: false,
    bankAccountSelected: false,
    readyToSync: false
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
  const [syncStatus, setSyncStatus] = useState(null);

  // useEffect Hooks
  useEffect(() => {
    if (user) {
      checkConnectionStatus();
      loadSyncSettings();
    }
  }, [user]);

  useEffect(() => {
    if (connections.freeagent.isConnected) {
      loadBankAccounts();
      loadEbayContact();
    }
    updateSetupStatus();
  }, [connections.freeagent.isConnected, connections.ebay.isConnected, selectedBankAccount]);

  // Helper Functions
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  // Enhanced Backend Integration Functions
  const loadSyncSettings = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/freeagent/sync-settings`,
        {
          headers: getAuthHeaders(),
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSyncSettings(data.data);
        setSelectedBankAccount(data.data.preferredBankAccount || "");
      }
    } catch (error) {
      console.error("Error loading sync settings:", error);
    }
  };

  const loadBankAccounts = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/freeagent/bank-accounts`,
        {
          headers: getAuthHeaders(),
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setBankAccounts(data.data.bankAccounts || []);
        
        if (data.data.bankAccounts.length === 1 && !selectedBankAccount) {
          const bankAccount = data.data.bankAccounts[0].apiUrl;
          setSelectedBankAccount(bankAccount);
          await saveSyncSettings({ preferredBankAccount: bankAccount });
        }
      }
    } catch (error) {
      console.error("Error loading bank accounts:", error);
      setError("Failed to load bank accounts from FreeAgent");
    }
  };

  const loadEbayContact = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/freeagent/contacts`,
        {
          headers: getAuthHeaders(),
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setEbayContact(data.data.ebayContact);
        
        if (data.data.ebayContact) {
          await saveSyncSettings({ 
            ebayContactUrl: data.data.ebayContact.apiUrl 
          });
        }
      }
    } catch (error) {
      console.error("Error loading eBay contact:", error);
    }
  };

  const saveSyncSettings = async (updates) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/freeagent/sync-settings`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          credentials: "include",
          body: JSON.stringify(updates),
        }
      );

      if (response.ok) {
        setSyncSettings(prev => ({ ...prev, ...updates }));
        updateSetupStatus();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error saving sync settings:", error);
      return false;
    }
  };

  const handleBankAccountChange = async (bankAccountUrl) => {
    setSelectedBankAccount(bankAccountUrl);
    const success = await saveSyncSettings({ 
      preferredBankAccount: bankAccountUrl 
    });
    if (!success) {
      setError("Failed to save bank account preference");
    }
  };

  const updateSetupStatus = () => {
    setSetupStatus({
      ebayConnected: connections.ebay.isConnected,
      freeagentConnected: connections.freeagent.isConnected,
      bankAccountSelected: !!selectedBankAccount,
      readyToSync: connections.ebay.isConnected && 
                  connections.freeagent.isConnected && 
                  !!selectedBankAccount
    });
  };

  // Enhanced Transaction Description Functions
  const generateEnhancedTransactionDescription = (txn) => {
    const {
      transactionType,
      transactionMemo,
      references = [],
      salesRecordReference,
      transactionStatus,
    } = txn;

    let description = '';
    
    if (transactionMemo && transactionMemo !== 'No description') {
      description = transactionMemo;
    } else {
      description = `eBay ${formatTransactionType(transactionType)}`;
    }

    const meaningfulReference = getMeaningfulReference(references, salesRecordReference);
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
      'SALE': 'Sale',
      'REFUND': 'Refund',
      'WITHDRAWAL': 'Payout/Withdrawal',
      'NON_SALE_CHARGE': 'Fee/Charge',
      'DISPUTE': 'Dispute',
      'TRANSFER': 'Transfer',
      'ADJUSTMENT': 'Adjustment',
      'CREDIT': 'Credit',
      'DEBIT': 'Debit'
    };
    
    return typeMap[transactionType] || transactionType;
  };

  const getMeaningfulReference = (references, salesRecordReference) => {
    if (!references || references.length === 0) {
      return salesRecordReference && salesRecordReference !== '0' 
        ? `Ref: ${salesRecordReference}` 
        : null;
    }

    const priorityOrder = ['ORDER_ID', 'ITEM_ID', 'PAYOUT_ID', 'TRANSACTION_ID', 'INVOICE_ID'];
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
      'ORDER_ID': `Order #${referenceId}`,
      'ITEM_ID': `Item #${referenceId}`,
      'PAYOUT_ID': `Payout #${referenceId}`,
      'TRANSACTION_ID': `Transaction #${referenceId}`,
      'INVOICE_ID': `Invoice #${referenceId}`,
      'DISPUTE_ID': `Dispute #${referenceId}`
    };
    
    return formatMap[referenceType] || `${referenceType}: ${referenceId}`;
  };

  const needsStatusInfo = (transactionStatus) => {
    const statusesNeedingInfo = [
      'FUNDS_PROCESSING',
      'FUNDS_ON_HOLD',
      'FUNDS_AVAILABLE_FOR_PAYOUT',
      'PAYOUT_INITIATED'
    ];
    
    return statusesNeedingInfo.includes(transactionStatus);
  };

  const formatTransactionStatus = (transactionStatus) => {
    const statusMap = {
      'FUNDS_PROCESSING': 'Processing',
      'FUNDS_ON_HOLD': 'On Hold',
      'FUNDS_AVAILABLE_FOR_PAYOUT': 'Ready for Payout',
      'PAYOUT_INITIATED': 'Payout Initiated',
      'COMPLETED': 'Completed'
    };
    
    return statusMap[transactionStatus] || transactionStatus;
  };

  // Backend API Functions
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
            environment: ebayData.data?.environment || ebayData.environment || "production",
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
            isConnected: freeagentData.data?.isConnected || freeagentData.isConnected,
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
        setBankAccounts([]);
        setSelectedBankAccount("");
        setEbayContact(null);
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
        setTransactions(data.data?.transactions || []);
        const processed = processTransactionsForFreeAgent(
          data.data?.transactions || []
        );
        setProcessedData(processed);
        setSyncStatus(`Fetched ${data.data?.transactions?.length || 0} transactions from eBay ${data.data?.environment || 'production'}`);
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

    if (!selectedBankAccount) {
      setError("Please select a bank account for the transactions");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const syncData = {
        transactions: processedData.freeAgentEntries.map(entry => ({
          dated_on: entry.date,
          amount: entry.transactionType === 'debit' ? -Math.abs(entry.amount) : Math.abs(entry.amount),
          description: entry.description,
          reference: entry.reference
        })),
        bankAccount: selectedBankAccount,
        ebayContact: ebayContact?.apiUrl || null
      };

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/freeagent/bank-transactions`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          credentials: "include",
          body: JSON.stringify(syncData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        const summary = data.data?.summary || {};
        setSyncStatus(
          `Enhanced sync completed! ${summary.totalCreated || processedData.freeAgentEntries.length} transactions created in ${
            bankAccounts.find(acc => acc.apiUrl === selectedBankAccount)?.name || 'selected account'
          }, ${summary.totalFailed || 0} failed. ${
            summary.linkedToEbayContact ? '✅ Linked to eBay contact' : ''
          }`
        );
        
        setProcessedData(null);
        setTransactions([]);
      } else {
        setError(data.message || "Failed to sync to FreeAgent");
      }
    } catch (error) {
      console.error("Enhanced FreeAgent sync error:", error);
      setError("Error syncing to FreeAgent");
    } finally {
      setIsLoading(false);
    }
  };

  // Data Processing Functions
  const processTransactionsForFreeAgent = (ebayTransactions) => {
    if (!ebayTransactions || ebayTransactions.length === 0) {
      return { freeAgentEntries: [], creditCount: 0, debitCount: 0 };
    }

    const freeAgentEntries = ebayTransactions.map((txn) => {
      const originalAmount = parseFloat(txn.amount?.value || 0);
      const isDebit = determineIfDebit(txn, originalAmount);
      const displayAmount = Math.abs(originalAmount);
      
      return {
        date: new Date(txn.transactionDate).toISOString().split("T")[0],
        amount: displayAmount,
        description: generateEnhancedTransactionDescription(txn),
        category: determineTransactionCategory(txn),
        reference: txn.transactionId,
        transactionType: isDebit ? 'debit' : 'credit',
        isDebit: isDebit,
        originalAmount: originalAmount
      };
    });

    return { 
      freeAgentEntries,
      totalAmount: freeAgentEntries.reduce((sum, entry) => sum + entry.amount, 0),
      creditCount: freeAgentEntries.filter(e => e.transactionType === 'credit').length,
      debitCount: freeAgentEntries.filter(e => e.transactionType === 'debit').length
    };
  };

  const determineIfDebit = (txn, amount) => {
    if (txn.bookingEntry === 'DEBIT' || 
        txn.transactionType === 'WITHDRAWAL' ||
        txn.transactionType === 'NON_SALE_CHARGE' ||
        txn.transactionType === 'REFUND' ||
        amount < 0) {
      return true;
    }
    return false;
  };

  const determineTransactionCategory = (txn) => {
    const categoryMap = {
      'SALE': 'Sales',
      'REFUND': 'Refunds', 
      'NON_SALE_CHARGE': 'Business Expenses',
      'WITHDRAWAL': 'Bank Transfers',
      'DISPUTE': 'Disputes',
      'ADJUSTMENT': 'Adjustments',
      'TRANSFER': 'Transfers'
    };
    return categoryMap[txn.transactionType] || 'Other';
  };

  const formatUKDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  };

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

  // UI Components
  const BankAccountSelector = () => {
    if (!connections.freeagent.isConnected || bankAccounts.length === 0) return null;

    return (
      <div className="bg-gray-50 rounded-lg p-4 mt-4">
        <h4 className="font-medium text-gray-900 mb-3">Select Bank Account</h4>
        <p className="text-sm text-gray-600 mb-3">
          Choose which FreeAgent bank account to sync your eBay transactions to:
        </p>
        <div className="space-y-2">
          {bankAccounts.map((account) => (
            <label key={account.id} className="flex items-center space-x-3 p-2 border rounded-md hover:bg-white cursor-pointer">
              <input
                type="radio"
                name="bankAccount"
                value={account.apiUrl}
                checked={selectedBankAccount === account.apiUrl}
                onChange={(e) => handleBankAccountChange(e.target.value)}
                className="h-4 w-4 text-blue-600"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{account.name}</span>
                  <span className="text-sm text-gray-500">
                    {account.currency} • {account.type}
                  </span>
                </div>
                {account.accountNumber && (
                  <div className="text-xs text-gray-400 mt-1">
                    Account: {account.accountNumber} | Sort: {account.sortCode}
                  </div>
                )}
                {account.currentBalance !== undefined && (
                  <div className="text-xs text-gray-500 mt-1">
                    Current Balance: {account.currency}{account.currentBalance}
                  </div>
                )}
              </div>
            </label>
          ))}
        </div>
        {!selectedBankAccount && (
          <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-amber-800 text-sm">
              ⚠️ Please select a bank account before syncing transactions
            </p>
          </div>
        )}
      </div>
    );
  };

  const EbayContactStatus = () => {
    if (!connections.freeagent.isConnected) return null;

    return (
      <div className="bg-gray-50 rounded-lg p-4 mt-4">
        <h4 className="font-medium text-gray-900 mb-2">eBay Contact in FreeAgent</h4>
        {ebayContact ? (
          <div className="flex items-center text-sm text-gray-600">
            <svg className="h-4 w-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{ebayContact.name}</span>
            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
              Auto-created
            </span>
          </div>
        ) : (
          <div className="flex items-center text-sm text-gray-500">
            <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>eBay contact will be created automatically when needed</span>
          </div>
        )}
        <p className="text-xs text-gray-500 mt-2">
          All eBay transactions will be linked to this contact for better organization in FreeAgent
        </p>
      </div>
    );
  };

  const SetupProgress = () => {
    const steps = [
      {
        name: "Connect eBay",
        completed: setupStatus.ebayConnected,
        description: "Link your eBay account"
      },
      {
        name: "Connect FreeAgent", 
        completed: setupStatus.freeagentConnected,
        description: "Link your FreeAgent account"
      },
      {
        name: "Select Bank Account",
        completed: setupStatus.bankAccountSelected,
        description: "Choose destination account"
      }
    ];

    return (
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Setup Progress</h3>
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={step.name} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mr-4 ${
                step.completed 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {step.completed ? (
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <div className="flex-1">
                <div className={`font-medium ${step.completed ? 'text-green-700' : 'text-gray-700'}`}>
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
              <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
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

  // Render Functions
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
                    Environment: {connections.ebay.environment} | Enhanced descriptions active
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
                Securely connect your eBay account to fetch transaction data with enhanced descriptions. Each user connects their own account.
              </p>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Enhanced transaction descriptions using eBay's rich data</li>
                <li>• Uses transaction memos and reference information</li>
                <li>• Production eBay API integration with RFC 9421 signatures</li>
                <li>• Individual account isolation - your data stays private</li>
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
                    Ready to sync transactions with enhanced descriptions and bank account selection
                  </p>
                </div>
              </div>
            </div>
            
            <BankAccountSelector />
            <EbayContactStatus />

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
                Connect FreeAgent to automatically create accounting entries with meaningful descriptions and proper bank account mapping.
              </p>
              <ul className="text-green-700 text-sm space-y-1">
                <li>• "Seller initiated payout - Payout #12345"</li>
                <li>• "Item sold via Buy It Now - Order #67890"</li>
                <li>• Choose which bank account to sync to</li>
                <li>• Automatic eBay contact creation for organization</li>
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

      {!setupStatus.readyToSync && <SetupProgress />}

      {/* Enhanced System Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          System Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-900">Backend Connected</p>
                <p className="text-blue-700 text-sm">Enhanced processing active</p>
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
              <div className={`h-3 w-3 rounded-full ${setupStatus.readyToSync ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderImportTab = () => (
    <div className="space-y-6">
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
                disabled={!setupStatus.readyToSync || isLoading}
                className={`px-6 py-2 rounded-md transition-colors flex items-center space-x-2 ${
                  setupStatus.readyToSync 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-gray-400 text-white cursor-not-allowed'
                }`}
              >
                <span>Enhanced Sync to FreeAgent ({processedData.freeAgentEntries.length})</span>
                {setupStatus.readyToSync && (
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
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
            <h4 className="font-medium text-yellow-900 mb-2">
              Setup Required
            </h4>
            <p className="text-yellow-800 text-sm">
              {(() => {
                const missing = [];
                if (!connections.ebay.isConnected) missing.push("Connect eBay");
                if (!connections.freeagent.isConnected) missing.push("Connect FreeAgent");
                if (!selectedBankAccount) missing.push("Select bank account");
                return `Please complete: ${missing.join(", ")}.`;
              })()}
            </p>
          </div>
        )}

        {setupStatus.readyToSync && selectedBankAccount && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-green-800 font-medium">Ready to Sync</p>
                <p className="text-green-600 text-sm">
                  Transactions will sync to: <strong>{bankAccounts.find(acc => acc.apiUrl === selectedBankAccount)?.name}</strong>
                  {ebayContact && <span> • Linked to <strong>{ebayContact.name}</strong></span>}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {syncStatus && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-blue-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
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
                          determineIfDebit(txn, parseFloat(txn.amount?.value || 0))
                            ? "text-red-600"
                            : "text-green-600"
                        }
                      >
                        {txn.amount?.currencyCode} {Math.abs(txn.amount?.value || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate font-medium" title={generateEnhancedTransactionDescription(txn)}>
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
            Connect to eBay and fetch transactions to see enhanced descriptions here.
          </p>
        </div>
      )}
    </div>
  );

  const renderFreeAgentEntriesTab = () => (
    <div className="space-y-6">
      {processedData?.freeAgentEntries?.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Enhanced FreeAgent Entries ({processedData.freeAgentEntries.length})
            </h3>
            <div className="flex items-center space-x-2">
              <div className="bg-green-100 px-3 py-1 rounded-full text-sm font-medium text-green-800">
                Ready for Enhanced Sync
              </div>
              {selectedBankAccount && (
                <div className="bg-blue-100 px-3 py-1 rounded-full text-sm font-medium text-blue-800">
                  → {bankAccounts.find(acc => acc.apiUrl === selectedBankAccount)?.name}
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
                      {formatUKDate(entry.date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <div className="truncate font-medium" title={entry.description}>
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
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {entry.isDebit ? 'Debit' : 'Credit'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span
                        className={
                          entry.isDebit ? "text-red-600" : "text-green-600"
                        }
                      >
                        {entry.isDebit ? '-' : '+'}£{entry.amount}
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
            Fetch eBay transactions first to generate enhanced FreeAgent entries.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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

        {/* Enhanced Footer */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Enhanced Production Integration
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
                <div className="font-medium text-gray-900">Bank Account</div>
                <div
                  className={`px-2 py-1 rounded text-xs ${
                    selectedBankAccount
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {selectedBankAccount ? "Selected" : "Not Selected"}
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
                <strong>New Features:</strong> Bank account selection, automatic eBay contact creation, 
                and enhanced transaction descriptions. Each user connects their own eBay account for complete data isolation.
              </p>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Setup Status:</span>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  setupStatus.readyToSync
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}>
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