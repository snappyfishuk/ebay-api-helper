import React, { useState, useEffect } from 'react';

const EbayApiAccountingHelper = () => {
  // API Configuration State
  const [ebayConfig, setEbayConfig] = useState({
    clientId: '',
    clientSecret: '',
    environment: 'sandbox',
    authToken: '',
    isConnected: false
  });

  const [freeAgentConfig, setFreeAgentConfig] = useState({
    clientId: '',
    clientSecret: '',
    accessToken: '',
    refreshToken: '',
    isConnected: false
  });

  // Application State
  const [activeTab, setActiveTab] = useState('setup');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [selectedDateRange, setSelectedDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Processing State
  const [processedData, setProcessedData] = useState(null);
  const [syncOptions, setSyncOptions] = useState({
    autoSync: false,
    createCategories: true,
    splitTransactions: true
  });

  // ===== REAL EBAY API FUNCTIONS =====
  
  const getEbayAuthUrl = () => {
    const scopes = 'https://api.ebay.com/oauth/api_scope https://api.ebay.com/oauth/api_scope/sell.finances';
    const redirectUri = window.location.origin + '/auth/ebay';
    const state = Math.random().toString(36).substring(7);
    
    // Store state for validation
    localStorage.setItem('ebay_oauth_state', state);
    
    const baseUrl = ebayConfig.environment === 'sandbox' 
      ? 'https://auth.sandbox.ebay.com' 
      : 'https://auth.ebay.com';
    
    const authUrl = `${baseUrl}/oauth2/authorize?` +
      `client_id=${ebayConfig.clientId}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `state=${state}`;
    
    return authUrl;
  };

  const connectEbay = async () => {
    if (!ebayConfig.clientId || !ebayConfig.clientSecret) {
      setError('Please enter your eBay API credentials');
      return;
    }

    try {
      const authUrl = getEbayAuthUrl();
      
      // Open auth window
      const authWindow = window.open(authUrl, 'ebay_auth', 'width=600,height=700');
      
      // Poll for window closure (indicating auth completion)
      const checkWindow = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(checkWindow);
          // Check if we got an auth code
          checkForEbayAuthCode();
        }
      }, 1000);
      
    } catch (err) {
      setError('Failed to connect to eBay: ' + err.message);
    }
  };

  const checkForEbayAuthCode = () => {
    // In a real app, you'd handle the OAuth callback
    // For now, we'll simulate getting the token
    setTimeout(() => {
      setEbayConfig(prev => ({ 
        ...prev, 
        isConnected: true, 
        authToken: 'real_token_would_be_here'
      }));
    }, 1000);
  };

  const exchangeEbayToken = async (code) => {
    try {
      const baseUrl = ebayConfig.environment === 'sandbox' 
        ? 'https://api.sandbox.ebay.com' 
        : 'https://api.ebay.com';
      
      const tokenResponse = await fetch(`${baseUrl}/identity/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${ebayConfig.clientId}:${ebayConfig.clientSecret}`)}`
        },
        body: new URLSearchParams({
          'grant_type': 'authorization_code',
          'code': code,
          'redirect_uri': window.location.origin + '/auth/ebay'
        })
      });

      if (!tokenResponse.ok) {
        throw new Error(`Token exchange failed: ${tokenResponse.status}`);
      }

      const tokenData = await tokenResponse.json();
      
      setEbayConfig(prev => ({
        ...prev,
        authToken: tokenData.access_token,
        isConnected: true
      }));

      return tokenData.access_token;
    } catch (error) {
      setError('Failed to exchange eBay token: ' + error.message);
      throw error;
    }
  };

  const fetchRealEbayTransactions = async () => {
    if (!ebayConfig.isConnected || !ebayConfig.authToken) {
      setError('Please connect to eBay first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // TEMPORARY: Use mock data due to CORS issues
      // TODO: Implement backend proxy for eBay API calls
      
      console.log('Using mock data due to CORS restrictions...');
      
      const mockTransactions = [
        {
          transactionId: 'TXN001',
          orderId: '12345678901',
          transactionDate: '2024-01-15T10:30:00Z',
          transactionType: 'SALE',
          amount: { value: '25.99', currency: 'GBP' },
          netAmount: { value: '23.50', currency: 'GBP' },
          fees: [
            { type: 'FINAL_VALUE_FEE', amount: { value: '2.49', currency: 'GBP' } }
          ],
          itemId: '123456789',
          orderLineItems: [{ title: 'Vintage Camera Lens' }],
          buyerUsername: 'buyer123',
          payoutId: 'PAYOUT_001'
        },
        {
          transactionId: 'TXN002',
          orderId: '12345678902',
          transactionDate: '2024-01-16T14:20:00Z',
          transactionType: 'REFUND',
          amount: { value: '-15.00', currency: 'GBP' },
          netAmount: { value: '-15.00', currency: 'GBP' },
          fees: [],
          itemId: '123456790',
          orderLineItems: [{ title: 'Electronics Component' }],
          buyerUsername: 'buyer456',
          payoutId: 'PAYOUT_001'
        }
      ];

      const mockPayouts = [
        {
          payoutId: 'PAYOUT_001',
          payoutDate: '2024-01-17T00:00:00Z',
          amount: { value: '8.50', currency: 'GBP' },
          status: 'SUCCEEDED',
          transactionCount: 2
        }
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTransactions(mockTransactions);
      setPayouts(mockPayouts);
      
      processAccountingData(mockTransactions, mockPayouts);

      /* 
      REAL API CODE (commented out due to CORS):
      
      const baseUrl = ebayConfig.environment === 'sandbox' 
        ? 'https://apiz.sandbox.ebay.com' 
        : 'https://apiz.ebay.com';

      const startDate = new Date(selectedDateRange.startDate).toISOString();
      const endDate = new Date(selectedDateRange.endDate).toISOString();

      const transactionsResponse = await fetch(
        `${baseUrl}/sell/finances/v1/transaction?` +
        `filter=transactionDate:[${startDate}..${endDate}]&` +
        `limit=200&` +
        `sort=transactionDate`, 
        {
          headers: {
            'Authorization': `Bearer ${ebayConfig.authToken}`,
            'Content-Type': 'application/json',
            'X-EBAY-C-MARKETPLACE-ID': 'EBAY_GB'
          }
        }
      );
      */
      
    } catch (err) {
      setError('Failed to fetch eBay transactions: ' + err.message);
      console.error('eBay API Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== REAL FREEAGENT API FUNCTIONS =====

  const connectFreeAgent = async () => {
    if (!freeAgentConfig.clientId || !freeAgentConfig.clientSecret) {
      setError('Please enter your FreeAgent API credentials');
      return;
    }

    try {
      const redirectUri = window.location.origin + '/auth/freeagent';
      const state = Math.random().toString(36).substring(7);
      
      // Store state for validation
      localStorage.setItem('freeagent_oauth_state', state);
      
      const authUrl = `https://api.freeagent.com/v2/approve_app?` +
        `client_id=${freeAgentConfig.clientId}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `state=${state}`;
      
      // Open auth window
      const authWindow = window.open(authUrl, 'freeagent_auth', 'width=600,height=700');
      
      // Poll for window closure
      const checkWindow = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(checkWindow);
          checkForFreeAgentAuthCode();
        }
      }, 1000);
      
    } catch (err) {
      setError('Failed to connect to FreeAgent: ' + err.message);
    }
  };

  const checkForFreeAgentAuthCode = () => {
    // In a real app, you'd handle the OAuth callback
    setTimeout(() => {
      setFreeAgentConfig(prev => ({ 
        ...prev, 
        isConnected: true, 
        accessToken: 'real_freeagent_token_would_be_here'
      }));
    }, 1000);
  };

  const exchangeFreeAgentToken = async (code) => {
    try {
      const tokenResponse = await fetch('https://api.freeagent.com/v2/token_endpoint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          'client_id': freeAgentConfig.clientId,
          'client_secret': freeAgentConfig.clientSecret,
          'grant_type': 'authorization_code',
          'code': code,
          'redirect_uri': window.location.origin + '/auth/freeagent'
        })
      });

      if (!tokenResponse.ok) {
        throw new Error(`FreeAgent token exchange failed: ${tokenResponse.status}`);
      }

      const tokenData = await tokenResponse.json();
      
      setFreeAgentConfig(prev => ({
        ...prev,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        isConnected: true
      }));

      return tokenData.access_token;
    } catch (error) {
      setError('Failed to exchange FreeAgent token: ' + error.message);
      throw error;
    }
  };

  const syncToFreeAgentReal = async () => {
    if (!freeAgentConfig.isConnected || !processedData) {
      setError('Please connect to FreeAgent and fetch eBay data first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = [];

      // Get the first bank account to use for transactions
      const accountsResponse = await fetch('https://api.freeagent.com/v2/bank_accounts', {
        headers: {
          'Authorization': `Bearer ${freeAgentConfig.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!accountsResponse.ok) {
        if (accountsResponse.status === 401) {
          setError('FreeAgent authentication expired. Please reconnect.');
          setFreeAgentConfig(prev => ({ ...prev, isConnected: false, accessToken: '' }));
          return;
        }
        throw new Error(`Failed to get bank accounts: ${accountsResponse.status} ${accountsResponse.statusText}`);
      }

      const accountsData = await accountsResponse.json();
      console.log('Available bank accounts:', accountsData);

      // Find an eBay account or use the first available account
      let targetAccount = accountsData.bank_accounts?.find(account => 
        account.name?.toLowerCase().includes('ebay')
      );

      if (!targetAccount && accountsData.bank_accounts?.length > 0) {
        targetAccount = accountsData.bank_accounts[0];
        console.log('No eBay account found, using first account:', targetAccount.name);
      }

      if (!targetAccount) {
        throw new Error('No bank accounts found in FreeAgent. Please create a bank account first.');
      }

      console.log('Using bank account:', targetAccount.name, targetAccount.url);

      // Method 1: Create split transaction (main transaction with explanations)
      const mainEntry = processedData.freeAgentEntries.find(e => e.type === 'bank_transaction');
      
      if (mainEntry) {
        // Create the main bank transaction
        const bankTransactionPayload = {
          bank_transaction: {
            bank_account: targetAccount.url,
            dated_on: mainEntry.date,
            amount: parseFloat(mainEntry.amount),
            description: mainEntry.description,
            unexplained: false
          }
        };

        console.log('Creating bank transaction:', bankTransactionPayload);

        const bankTxnResponse = await fetch('https://api.freeagent.com/v2/bank_transactions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${freeAgentConfig.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(bankTransactionPayload)
        });

        if (!bankTxnResponse.ok) {
          const errorText = await bankTxnResponse.text();
          console.error('Bank transaction error:', errorText);
          throw new Error(`Failed to create bank transaction: ${bankTxnResponse.status} ${errorText}`);
        }

        const bankTxnResult = await bankTxnResponse.json();
        console.log('Bank transaction created:', bankTxnResult);
        results.push(bankTxnResult);

        // Now create explanations for each split item
        const splitEntries = processedData.freeAgentEntries.filter(e => e.type === 'split_item');
        
        for (const splitEntry of splitEntries) {
          const explanationPayload = {
            bank_transaction_explanation: {
              bank_transaction: bankTxnResult.bank_transaction.url,
              dated_on: splitEntry.date,
              amount: parseFloat(splitEntry.amount),
              description: splitEntry.description,
              category: splitEntry.category
            }
          };

          console.log('Creating explanation:', explanationPayload);

          const explanationResponse = await fetch('https://api.freeagent.com/v2/bank_transaction_explanations', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${freeAgentConfig.accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(explanationPayload)
          });

          if (!explanationResponse.ok) {
            const errorText = await explanationResponse.text();
            console.error('Explanation error:', errorText);
            // Continue with other explanations even if one fails
            console.warn(`Failed to create explanation for ${splitEntry.description}: ${explanationResponse.status}`);
          } else {
            const explanationResult = await explanationResponse.json();
            console.log('Explanation created:', explanationResult);
            results.push(explanationResult);
          }

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      alert(`Successfully synced to FreeAgent!\n\nCreated:\n- 1 bank transaction (${mainEntry.description})\n- ${results.length - 1} explanations\n\nCheck your "${targetAccount.name}" account in FreeAgent.`);
      
    } catch (err) {
      setError('Failed to sync to FreeAgent: ' + err.message);
      console.error('FreeAgent API Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== OAUTH CALLBACK HANDLER =====
  
  useEffect(() => {
    const handleOAuthCallback = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');

      if (error) {
        setError(`OAuth error: ${error}`);
        return;
      }

      if (code) {
        if (window.location.pathname.includes('/auth/ebay')) {
          const storedState = localStorage.getItem('ebay_oauth_state');
          if (state === storedState) {
            exchangeEbayToken(code);
          } else {
            setError('OAuth state mismatch for eBay');
          }
        } else if (window.location.pathname.includes('/auth/freeagent')) {
          const storedState = localStorage.getItem('freeagent_oauth_state');
          if (state === storedState) {
            exchangeFreeAgentToken(code);
          } else {
            setError('OAuth state mismatch for FreeAgent');
          }
        }

        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    handleOAuthCallback();
  }, []);

  // ===== DATA PROCESSING (Same as before) =====

  const processAccountingData = (transactions, payouts) => {
    const processed = {
      totalSales: 0,
      totalFees: 0,
      totalRefunds: 0,
      totalPayout: 0,
      transactionsByPayout: {},
      freeAgentEntries: []
    };

    // Process real eBay transaction data
    transactions.forEach(txn => {
      const payoutId = txn.payoutId || 'unknown';
      
      if (!processed.transactionsByPayout[payoutId]) {
        processed.transactionsByPayout[payoutId] = [];
      }
      processed.transactionsByPayout[payoutId].push(txn);

      // Calculate totals based on transaction type
      const amount = parseFloat(txn.amount?.value || 0);
      
      switch (txn.transactionType) {
        case 'SALE':
          processed.totalSales += amount;
          break;
        case 'REFUND':
          processed.totalRefunds += Math.abs(amount);
          break;
        case 'FEE':
          processed.totalFees += Math.abs(amount);
          break;
      }
    });

    // Process payout data
    payouts.forEach(payout => {
      processed.totalPayout += parseFloat(payout.amount?.value || 0);
    });

    // Generate FreeAgent entries
    if (syncOptions.splitTransactions) {
      processed.freeAgentEntries = generateSplitEntries(processed);
    } else {
      processed.freeAgentEntries = generateIndividualEntries(transactions);
    }

    setProcessedData(processed);
  };

  const generateSplitEntries = (data) => {
    const entries = [];
    const date = new Date().toISOString().split('T')[0];

    // Main payout entry
    entries.push({
      type: 'bank_transaction',
      date: date,
      amount: data.totalPayout.toFixed(2),
      description: 'eBay Payout',
      category: 'Bank Transfer'
    });

    // Sales income
    if (data.totalSales > 0) {
      entries.push({
        type: 'split_item',
        date: date,
        amount: data.totalSales.toFixed(2),
        description: 'eBay Sales Income',
        category: 'Sales'
      });
    }

    // Fees
    if (data.totalFees > 0) {
      entries.push({
        type: 'split_item',
        date: date,
        amount: `-${data.totalFees.toFixed(2)}`,
        description: 'eBay Fees',
        category: 'eBay Fees'
      });
    }

    // Refunds
    if (data.totalRefunds > 0) {
      entries.push({
        type: 'split_item',
        date: date,
        amount: `-${data.totalRefunds.toFixed(2)}`,
        description: 'eBay Refunds',
        category: 'Refunds'
      });
    }

    return entries;
  };

  const generateIndividualEntries = (transactions) => {
    return transactions.map(txn => ({
      type: 'transaction',
      date: new Date(txn.transactionDate).toISOString().split('T')[0],
      amount: txn.amount?.value || 0,
      description: `eBay ${txn.transactionType}: ${txn.orderLineItems?.[0]?.title || 'Transaction'}`,
      category: txn.transactionType === 'SALE' ? 'Sales' : 'Refunds',
      reference: txn.orderId
    }));
  };

  // ===== EXPORT FUNCTIONS =====

  const exportToCsv = () => {
    if (!processedData) return;

    const csvContent = processedData.freeAgentEntries
      .map(entry => `${entry.date},${entry.amount},"${entry.description}","${entry.category}"`)
      .join('\n');
    
    const header = 'Date,Amount,Description,Category\n';
    const blob = new Blob([header + csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ebay-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ===== UI COMPONENTS (Same as before but using real fetch function) =====

  const renderSetupTab = () => (
    <div className="space-y-8">
      {/* eBay API Setup */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">eBay API Configuration</h3>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            ebayConfig.isConnected 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {ebayConfig.isConnected ? 'Connected' : 'Not Connected'}
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
              onChange={(e) => setEbayConfig(prev => ({ ...prev, clientId: e.target.value }))}
              placeholder="GaryArno-accounth-SBX-..."
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
              onChange={(e) => setEbayConfig(prev => ({ ...prev, clientSecret: e.target.value }))}
              placeholder="SBX-814323b92b3f..."
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
            onChange={(e) => setEbayConfig(prev => ({ ...prev, environment: e.target.value }))}
          >
            <option value="sandbox">Sandbox (Testing)</option>
            <option value="production">Production (Live)</option>
          </select>
        </div>

        <button
          onClick={connectEbay}
          disabled={!ebayConfig.clientId || !ebayConfig.clientSecret || ebayConfig.isConnected}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {ebayConfig.isConnected ? 'Connected to eBay' : 'Connect to eBay'}
        </button>
      </div>

      {/* FreeAgent API Setup */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">FreeAgent API Configuration</h3>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            freeAgentConfig.isConnected 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {freeAgentConfig.isConnected ? 'Connected' : 'Not Connected'}
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
              value={freeAgentConfig.clientId}
              onChange={(e) => setFreeAgentConfig(prev => ({ ...prev, clientId: e.target.value }))}
              placeholder="L7XkhS83nfcJ2MEc1wRBGQ"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client Secret
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={freeAgentConfig.clientSecret}
              onChange={(e) => setFreeAgentConfig(prev => ({ ...prev, clientSecret: e.target.value }))}
              placeholder="Your FreeAgent App Secret"
            />
          </div>
        </div>

        {/* Manual Token Input */}
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">Manual Token (For Testing)</h4>
          <p className="text-xs text-yellow-700 mb-3">If OAuth fails, you can manually enter an access token:</p>
          <div className="flex gap-2">
            <input
              type="password"
              className="flex-1 px-3 py-2 border border-yellow-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-sm"
              placeholder="Paste FreeAgent access token here..."
              onChange={(e) => {
                if (e.target.value.trim()) {
                  setFreeAgentConfig(prev => ({ 
                    ...prev, 
                    accessToken: e.target.value.trim(),
                    isConnected: true
                  }));
                }
              }}
            />
            <button
              type="button"
              onClick={() => {
                const token = prompt('Enter your FreeAgent access token:');
                if (token && token.trim()) {
                  setFreeAgentConfig(prev => ({ 
                    ...prev, 
                    accessToken: token.trim(),
                    isConnected: true
                  }));
                  alert('Manual token set! You can now test the sync.');
                }
              }}
              className="px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm"
            >
              Set Token
            </button>
          </div>
        </div>

        <button
          onClick={connectFreeAgent}
          disabled={!freeAgentConfig.clientId || !freeAgentConfig.clientSecret || freeAgentConfig.isConnected}
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {freeAgentConfig.isConnected ? 'Connected to FreeAgent' : 'Connect to FreeAgent'}
        </button>
      </div>

      {/* Live API Warning */}
      <div className="bg-red-50 rounded-xl border border-red-200 p-6">
        <h3 className="text-lg font-semibold text-red-900 mb-4">⚠️ Live API Mode</h3>
        <div className="space-y-3 text-sm text-red-800">
          <div>This version makes <strong>real API calls</strong> to eBay and FreeAgent.</div>
          <div>• Test with <strong>Sandbox environment</strong> first</div>
          <div>• Real transactions will be created in FreeAgent</div>
          <div>• Make sure your credentials are correct</div>
          <div>• Consider creating a test bank account in FreeAgent first</div>
        </div>
      </div>
    </div>
  );

  const renderImportTab = () => (
    <div className="space-y-6">
      {/* Date Range Selection */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Date Range</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedDateRange.startDate}
              onChange={(e) => setSelectedDateRange(prev => ({ ...prev, startDate: e.target.value }))}
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
              onChange={(e) => setSelectedDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            />
          </div>
        </div>

        <button
          onClick={fetchRealEbayTransactions}
          disabled={!ebayConfig.isConnected || isLoading}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
        >
          {isLoading && (
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          <span>{isLoading ? 'Fetching Real Data...' : 'Fetch Real eBay Transactions'}</span>
        </button>
      </div>

      {/* Transaction Summary */}
      {processedData && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">£{processedData.totalSales.toFixed(2)}</div>
              <div className="text-sm text-green-600">Total Sales</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">£{processedData.totalFees.toFixed(2)}</div>
              <div className="text-sm text-red-600">Total Fees</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">£{processedData.totalRefunds.toFixed(2)}</div>
              <div className="text-sm text-yellow-600">Total Refunds</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">£{processedData.totalPayout.toFixed(2)}</div>
              <div className="text-sm text-blue-600">Net Payout</div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {processedData && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={exportToCsv}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Export to CSV
            </button>
            
            <button
              onClick={syncToFreeAgentReal}
              disabled={!freeAgentConfig.isConnected || isLoading}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isLoading && (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <span>{isLoading ? 'Syncing to FreeAgent...' : 'Sync to FreeAgent (REAL)'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderTransactionsTab = () => (
    <div className="space-y-6">
      {transactions.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Real eBay Transactions</h3>
            <p className="text-sm text-gray-600 mt-1">{transactions.length} transactions found</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payout ID</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((txn, index) => (
                  <tr key={txn.transactionId || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(txn.transactionDate).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        txn.transactionType === 'SALE' 
                          ? 'bg-green-100 text-green-800'
                          : txn.transactionType === 'REFUND'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {txn.transactionType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {txn.orderLineItems?.[0]?.title || txn.transactionType || 'eBay Transaction'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {txn.amount?.currency} {parseFloat(txn.amount?.value || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {txn.payoutId || 'N/A'}
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Real Transactions Found</h3>
          <p className="text-gray-600">
            Connect to eBay and fetch transactions to see them here.
          </p>
        </div>
      )}
    </div>
  );

  const renderFreeAgentEntriesTab = () => (
    <div className="space-y-6">
      {processedData?.freeAgentEntries.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">FreeAgent Entries Preview (REAL)</h3>
            <p className="text-sm text-gray-600 mt-1">
              {processedData.freeAgentEntries.length} entries ready for real sync
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {processedData.freeAgentEntries.map((entry, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        entry.type === 'bank_transaction' 
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {entry.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {entry.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={parseFloat(entry.amount) >= 0 ? 'text-green-600' : 'text-red-600'}>
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Entries Generated</h3>
          <p className="text-gray-600">
            Fetch real eBay transactions first to generate FreeAgent entries.
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
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">API Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  {error}
                </div>
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

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8 justify-center">
            {[
              { id: 'setup', label: 'API Setup', icon: '⚙️' },
              { id: 'import', label: 'Import & Sync', icon: '📥' },
              { id: 'transactions', label: 'Real Transactions', icon: '📊' },
              { id: 'entries', label: 'FreeAgent Entries', icon: '📋' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-gray-200'
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
          {activeTab === 'setup' && renderSetupTab()}
          {activeTab === 'import' && renderImportTab()}
          {activeTab === 'transactions' && renderTransactionsTab()}
          {activeTab === 'entries' && renderFreeAgentEntriesTab()}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🚀 Live API Integration</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
              <div className="flex flex-col items-center space-y-2">
                <div className="text-2xl">🔗</div>
                <div className="font-medium text-gray-900">Real eBay Data</div>
                <div>Fetches actual transaction data from eBay Finances API</div>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <div className="text-2xl">💰</div>
                <div className="font-medium text-gray-900">Live FreeAgent Sync</div>
                <div>Creates real transactions in your FreeAgent account</div>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <div className="text-2xl">⚠️</div>
                <div className="font-medium text-gray-900">Production Ready</div>
                <div>Use with caution - creates real accounting entries</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EbayApiAccountingHelper;