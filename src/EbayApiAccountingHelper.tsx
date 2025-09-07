// EbayApiAccountingHelper.tsx - Single Header Navigation
import React, { useState, useEffect } from "react";
import { 
  useEbayConnection, 
  useFreeAgentConnection, 
  useTransactions, 
  useSetupStatus 
} from "./hooks";
import { User, Connections } from "./types";
import { SetupTab } from "./components/tabs/SetupTab";
import { ImportTab } from "./components/tabs/ImportTab";
import { TransactionsTab } from "./components/tabs/TransactionsTab";
import { FreeAgentEntriesTab } from "./components/tabs/FreeAgentEntriesTab";

interface EbayApiAccountingHelperProps {
  user: User;
}

type NavigationId = 'dashboard' | 'autosync' | 'manual' | 'history';

// Test User Detection Component
const TrialAlert: React.FC<{ user?: User }> = ({ user }) => {
  const [trialData, setTrialData] = useState<any>(null);

  useEffect(() => {
    const fetchTrial = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/users/subscription`,
          {
            headers: { Authorization: `Bearer ${token}` },
            credentials: 'include',
          }
        );
        if (response.ok) {
          const data = await response.json();
          setTrialData(data.data);
        }
      } catch (error) {
        console.error('Trial fetch error:', error);
      }
    };
    fetchTrial();
  }, []);

  const isTestUser = user?.email === 'gary.arnold@hotmail.co.uk';

  if (isTestUser) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-green-800">
            ✓ Test Account - Unlimited Access
          </span>
          <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">
            Developer
          </span>
        </div>
      </div>
    );
  }

  if (!trialData || trialData.subscriptionStatus !== 'trial' || 
      (trialData.daysRemaining && trialData.daysRemaining > 5)) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-yellow-800">
          Trial ends in {trialData.daysRemaining || 0} day{(trialData.daysRemaining || 0) === 1 ? '' : 's'}
        </span>
        <button className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700">
          Upgrade
        </button>
      </div>
    </div>
  );
};

const EbayApiAccountingHelper: React.FC<EbayApiAccountingHelperProps> = ({ user }) => {
  const [activeNav, setActiveNav] = useState<NavigationId>("dashboard");
  
  const ebayConnection = useEbayConnection();
  const freeagentConnection = useFreeAgentConnection();
  const transactionsManager = useTransactions(ebayConnection.connection.isConnected);
  
  const connections: Connections = {
    ebay: ebayConnection.connection,
    freeagent: freeagentConnection.connection,
  };
  
  const setupStatus = useSetupStatus(connections, freeagentConnection.ebayAccountStatus);

  useEffect(() => {
    if (user) {
      Promise.all([
        ebayConnection.checkConnection(),
        freeagentConnection.checkConnection(),
      ]);

      console.log("USER DATA CHECK:", {
        hasUser: !!user,
        email: user?.email,
        ebayConnected: user?.ebayConnection?.isConnected,
        ebayEnvironment: user?.ebayConnection?.environment,
        ebayUsername: user?.ebayConnection?.username,
        ebayUserId: user?.ebayConnection?.userId
      });
    }
  }, [user]);

  const renderContent = () => {
    const commonProps = {
      connections,
      setupStatus,
      ebayAccountStatus: freeagentConnection.ebayAccountStatus,
      isLoading: ebayConnection.isLoading || freeagentConnection.isLoading || transactionsManager.isLoading,
    };

    switch (activeNav) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Connection Setup</h3>
              <p className="text-gray-600 text-sm">Connect your eBay and FreeAgent accounts to get started</p>
            </div>
            
            <SetupTab
              {...commonProps}
              availableEbayAccounts={freeagentConnection.availableEbayAccounts}
              user={user}
              onConnectEbay={ebayConnection.connect}
              onDisconnectEbay={ebayConnection.disconnect}
              onConnectFreeAgent={freeagentConnection.connect}
              onDisconnectFreeAgent={freeagentConnection.disconnect}
              onCreateEbayAccount={freeagentConnection.createEbayAccount}
              onSelectEbayAccount={freeagentConnection.selectExistingEbayAccount}
            />
          </div>
        );
        
      case 'autosync':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Auto-Sync Configuration</h3>
              <p className="text-gray-600 text-sm">Automatically sync your eBay transactions to FreeAgent daily</p>
            </div>
            
            {setupStatus.readyToSync ? (
              <div className="space-y-6">
                {/* Auto-Sync Status Card */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-green-800">Auto-Sync Settings</h4>
                      <p className="text-green-700 text-sm">Syncs daily at 2:00 AM UK time</p>
                    </div>
                    <div className="bg-green-100 px-3 py-1 rounded-full text-sm font-medium text-green-800">
                      Active
                    </div>
                  </div>
                </div>

                {/* Fixed Schedule Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h4 className="text-md font-semibold text-blue-800 mb-3">Fixed Schedule (Like FreeAgent Amazon)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700 font-medium">Sync Time:</span>
                      <div className="text-blue-600">02:00 AM</div>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Frequency:</span>
                      <div className="text-blue-600">Daily</div>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Timezone:</span>
                      <div className="text-blue-600">UK Time</div>
                    </div>
                  </div>
                  <p className="text-blue-600 text-xs mt-2">
                    No time selection needed - automatically syncs at the optimal time for eBay transactions
                  </p>
                </div>

                {/* Auto-Sync Controls */}
                <div className="bg-white border rounded-lg p-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Auto-Sync Control</h4>
                  
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="font-medium text-gray-900">Enable Auto-Sync</div>
                      <div className="text-sm text-gray-600">Automatically sync eBay transactions daily at 2:00 AM UK time</div>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        defaultChecked={true}
                      />
                    </div>
                  </div>

                  {/* Transaction Lag Options */}
                  <div className="mb-6">
                    <div className="font-medium text-gray-900 mb-2">Transaction Lag (Days)</div>
                    <div className="text-sm text-gray-600 mb-3">
                      Wait this many days before syncing transactions (reduced from Amazon's 3 days for faster eBay processing)
                    </div>
                    <div className="flex space-x-2">
                      <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded font-medium">
                        1 day
                      </button>
                      <button className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded font-medium hover:bg-gray-300">
                        2 days
                      </button>
                      <button className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded font-medium hover:bg-gray-300">
                        3 days
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Recommended: 2 days (balances accuracy with speed)</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-4">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium">
                      Save Settings
                    </button>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium">
                      Test Now
                    </button>
                  </div>
                </div>

                {/* Sync Status */}
                <div className="bg-white border rounded-lg p-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Sync Status</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">Schedule</div>
                      <div className="text-sm text-gray-600">Next sync: 8 Sept 2025, 02:00</div>
                      <div className="text-sm text-gray-600">Last sync: 7 Sept 2025, 13:00</div>
                      <div className="text-sm text-gray-600">Retry count: 0/3</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">Statistics</div>
                      <div className="text-sm text-gray-600">Total syncs: 13</div>
                      <div className="text-sm text-gray-600">Successful: 12</div>
                      <div className="text-sm text-red-600">Failed: 1</div>
                      <div className="text-sm text-gray-600">Avg transactions: 10</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="text-center">
                  <div className="text-2xl mb-2">⚠️</div>
                  <h4 className="text-lg font-semibold text-yellow-800 mb-2">Setup Required</h4>
                  <p className="text-yellow-700 text-sm mb-4">Complete your account connections on the Dashboard to enable auto-sync.</p>
                  
                  <button 
                    onClick={() => setActiveNav('dashboard')}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
        );
        
      case 'manual':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Manual Tools</h3>
              <p className="text-gray-600 text-sm">Manual sync tools, troubleshooting, and CSV export</p>
            </div>
            
            <ImportTab
              {...commonProps}
              selectedDateRange={transactionsManager.selectedDateRange}
              onStartDateChange={transactionsManager.handleStartDateChange}
              onEndDateChange={transactionsManager.handleEndDateChange}
              onSetDatePreset={transactionsManager.setDatePreset}
              onFetchTransactions={transactionsManager.fetchTransactions}
              onSyncToFreeAgent={() => transactionsManager.syncToFreeAgent(freeagentConnection.ebayAccountStatus)}
              onExportCsv={transactionsManager.exportToCsv}
              processedData={transactionsManager.processedData}
              syncStatus={transactionsManager.syncStatus}
            />
          </div>
        );
        
      case 'history':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Transaction History</h3>
              <p className="text-gray-600 text-sm">View eBay transactions and FreeAgent entries</p>
            </div>
            
            {/* eBay Transactions - Top Box */}
            <div className="bg-white border rounded-lg">
              <div className="p-4 border-b bg-gray-50">
                <h4 className="text-md font-semibold text-gray-900">eBay Transactions</h4>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <TransactionsTab transactions={transactionsManager.transactions} />
              </div>
            </div>
            
            {/* FreeAgent Entries - Bottom Box */}
            <div className="bg-white border rounded-lg">
              <div className="p-4 border-b bg-gray-50">
                <h4 className="text-md font-semibold text-gray-900">FreeAgent Entries</h4>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <FreeAgentEntriesTab
                  processedData={transactionsManager.processedData}
                  ebayAccountStatus={freeagentConnection.ebayAccountStatus}
                />
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  const error = ebayConnection.error || freeagentConnection.error || transactionsManager.error;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* App Header with Branding */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent mb-2">
            eBay FreeAgent Sync
          </h1>
          <p className="text-gray-600 text-sm">
            Automated eBay transaction sync with FreeAgent accounting
          </p>
        </div>
        
        <TrialAlert user={user} />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-red-800 text-sm">{error}</span>
              <button 
                onClick={() => {
                  ebayConnection.error && ebayConnection.checkConnection();
                  freeagentConnection.error && freeagentConnection.checkConnection();
                }}
                className="text-red-600 text-xs hover:text-red-800"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Connection Status Cards - PRESERVED */}
        <div className="bg-gradient-to-r from-blue-50 via-green-50 to-purple-50 border-2 border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Connection Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-red-50 border-2 border-blue-200 rounded-lg p-4 text-center">
              <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${(user?.ebayConnection?.isConnected || connections.ebay.isConnected) ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              <div className="text-sm font-bold text-blue-800 mb-1">eBay Username</div>
              <div className="text-xs text-blue-700 truncate font-medium" title={
                (user?.ebayConnection?.isConnected || connections.ebay.isConnected) 
                  ? (user?.ebayConnection?.username || `Connected (${user?.ebayConnection?.environment || 'production'})`)
                  : 'Setup needed'
              }>
                {(user?.ebayConnection?.isConnected || connections.ebay.isConnected) 
                  ? (user?.ebayConnection?.username || `Connected (${user?.ebayConnection?.environment || 'production'})`)
                  : 'Setup needed'}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4 text-center">
              <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${(user?.freeagentConnection?.isConnected || connections.freeagent.isConnected) ? 'bg-green-600' : 'bg-gray-300'}`}></div>
              <div className="text-sm font-bold text-green-800 mb-1">FreeAgent User Email</div>
              <div className="text-xs text-green-700 truncate font-medium" title={
                (user?.freeagentConnection?.isConnected || connections.freeagent.isConnected) 
                  ? (user?.email || 'Connected')
                  : 'Setup needed'
              }>
                {(user?.freeagentConnection?.isConnected || connections.freeagent.isConnected) 
                  ? (user?.email || 'Connected')
                  : 'Setup needed'}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-lg p-4 text-center">
              <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${freeagentConnection.ebayAccountStatus.hasEbayAccount ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
              <div className="text-sm font-bold text-purple-800 mb-1">FreeAgent Bank Account</div>
              <div className="text-xs text-purple-700 truncate font-medium" title={
                freeagentConnection.ebayAccountStatus.hasEbayAccount 
                  ? (freeagentConnection.ebayAccountStatus.bankAccount?.name || 'eBay Sales Account')
                  : 'Setup needed'
              }>
                {freeagentConnection.ebayAccountStatus.hasEbayAccount 
                  ? (freeagentConnection.ebayAccountStatus.bankAccount?.name || 'eBay Sales Account')
                  : 'Setup needed'}
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-200 rounded-lg p-4 text-center">
              <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${
                (user?.ebayConnection?.isConnected || connections.ebay.isConnected) && 
                (user?.freeagentConnection?.isConnected || connections.freeagent.isConnected) && 
                freeagentConnection.ebayAccountStatus.hasEbayAccount ? 'bg-green-600' : 'bg-yellow-500'
              }`}></div>
              <div className="text-sm font-bold text-gray-800 mb-1">System Status</div>
              <div className="text-xs text-gray-700 font-medium">
                {(user?.ebayConnection?.isConnected || connections.ebay.isConnected) && 
                 (user?.freeagentConnection?.isConnected || connections.freeagent.isConnected) && 
                 freeagentConnection.ebayAccountStatus.hasEbayAccount ? 'Ready to Sync' : 'Setup Required'}
              </div>
            </div>
          </div>
        </div>

        {/* SINGLE HEADER NAVIGATION - No Tabs */}
        <div className="mb-6">
          <div className="flex space-x-2 justify-center">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
              { id: 'autosync', label: 'Auto-Sync', icon: '⚡' },
              { id: 'manual', label: 'Manual Tools', icon: '🔧' },
              { id: 'history', label: 'Transaction History', icon: '📊' },
            ].map((nav) => (
              <button
                key={nav.id}
                onClick={() => setActiveNav(nav.id as NavigationId)}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeNav === nav.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border'
                }`}
              >
                <span>{nav.icon}</span>
                <span>{nav.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          {renderContent()}
        </div>

      </div>
    </div>
  );
};

export default EbayApiAccountingHelper;