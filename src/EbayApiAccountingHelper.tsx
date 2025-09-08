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
import { AutoSyncTab } from "./components/tabs/AutoSyncTab";

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
      {/* Dashboard Overview */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {setupStatus.readyToSync ? 'Dashboard Overview' : 'Welcome to eBay API Helper'}
        </h3>
        <p className="text-gray-600 text-sm">
          {setupStatus.readyToSync 
            ? 'Monitor your eBay transaction syncing with FreeAgent' 
            : 'Complete the setup to start syncing eBay transactions'}
        </p>
      </div>

      {/* Setup Progress - Only if not ready */}
      {!setupStatus.readyToSync && (
        <div className="bg-white border rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Setup Progress</h4>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold ${
                connections.ebay.isConnected ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}>
                {connections.ebay.isConnected ? '✓' : '1'}
              </div>
              <div className="flex-1">
                <span className={connections.ebay.isConnected ? 'text-green-600 font-medium' : 'text-gray-600'}>
                  Connect eBay account
                </span>
              </div>
              {!connections.ebay.isConnected && (
                <button
                  onClick={ebayConnection.connect}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Connect
                </button>
              )}
            </div>
            
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold ${
                connections.freeagent.isConnected ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}>
                {connections.freeagent.isConnected ? '✓' : '2'}
              </div>
              <div className="flex-1">
                <span className={connections.freeagent.isConnected ? 'text-green-600 font-medium' : 'text-gray-600'}>
                  Connect FreeAgent account
                </span>
              </div>
              {!connections.freeagent.isConnected && (
                <button
                  onClick={freeagentConnection.connect}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  Connect
                </button>
              )}
            </div>
            
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold ${
                freeagentConnection.ebayAccountStatus.hasEbayAccount ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}>
                {freeagentConnection.ebayAccountStatus.hasEbayAccount ? '✓' : '3'}
              </div>
              <span className={freeagentConnection.ebayAccountStatus.hasEbayAccount ? 'text-green-600 font-medium' : 'text-gray-600'}>
                Set up eBay bank account in FreeAgent
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats - Only if ready to sync */}
      {setupStatus.readyToSync && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Syncs</p>
                <p className="text-2xl font-bold text-gray-900">{user?.autoSync?.stats?.totalAutoSyncs || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Successful</p>
                <p className="text-2xl font-bold text-gray-900">{user?.autoSync?.stats?.successfulAutoSyncs || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Auto-Sync</p>
                <p className="text-2xl font-bold text-gray-900">
                  {user?.autoSync?.enabled ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity or Quick Actions */}
      {setupStatus.readyToSync ? (
        <div className="bg-white border rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">Last Auto-Sync</p>
                <p className="text-xs text-gray-500">
                  {user?.autoSync?.lastAutoSync 
                    ? new Date(user.autoSync.lastAutoSync).toLocaleString('en-GB')
                    : 'Never run'}
                </p>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                user?.autoSync?.lastAutoSync ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {user?.autoSync?.lastAutoSync ? 'Complete' : 'Pending'}
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-900">Next Scheduled Sync</p>
                <p className="text-xs text-gray-500">
                  {user?.autoSync?.nextScheduledSync 
                    ? new Date(user.autoSync.nextScheduledSync).toLocaleString('en-GB')
                    : 'Not scheduled'}
                </p>
              </div>
              <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                {user?.autoSync?.enabled ? 'Scheduled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border rounded-lg p-6">
          <div className="text-center">
            <div className="text-4xl mb-4">🚀</div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Quick Actions</h4>
            <p className="text-gray-600 mb-6">
              Jump to different sections to set up or use the system.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => setActiveNav('autosync')}
                className="p-4 border border-blue-300 rounded-lg hover:bg-blue-50 text-left transition-colors"
              >
                <div className="font-medium text-blue-900">Configure Auto-Sync</div>
                <div className="text-sm text-blue-600">Set up automatic daily syncing</div>
              </button>
              <button 
                onClick={() => setActiveNav('manual')}
                className="p-4 border border-green-300 rounded-lg hover:bg-green-50 text-left transition-colors"
              >
                <div className="font-medium text-green-900">Manual Tools</div>
                <div className="text-sm text-green-600">One-time sync for specific dates</div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
        
      case 'autosync':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Auto-Sync Configuration</h3>
              <p className="text-gray-600 text-sm">Automatically sync your eBay transactions to FreeAgent daily</p>
            </div>
            
            <AutoSyncTab
              connections={connections}
              setupStatus={setupStatus}
              ebayAccountStatus={freeagentConnection.ebayAccountStatus}
              user={user}
              isLoading={ebayConnection.isLoading || freeagentConnection.isLoading || transactionsManager.isLoading}
            />
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

        {/* Connection Status Cards - eBay & FreeAgent Brand Colors */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Connection Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* eBay Status - Official eBay Colors (Blue/Red) */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-4 text-center">
              <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${(user?.ebayConnection?.isConnected || connections.ebay.isConnected) ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              <div className="text-sm font-bold text-blue-900 mb-1">eBay Username</div>
              <div className="text-xs text-blue-800 truncate font-medium" title={
                (user?.ebayConnection?.isConnected || connections.ebay.isConnected) 
                  ? (user?.ebayConnection?.username || `Connected (${user?.ebayConnection?.environment || 'production'})`)
                  : 'Setup needed'
              }>
                {(user?.ebayConnection?.isConnected || connections.ebay.isConnected) 
                  ? (user?.ebayConnection?.username || `Connected (${user?.ebayConnection?.environment || 'production'})`)
                  : 'Setup needed'}
              </div>
            </div>
            
            {/* FreeAgent Status - Official FreeAgent Colors (Green) */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-lg p-4 text-center">
              <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${(user?.freeagentConnection?.isConnected || connections.freeagent.isConnected) ? 'bg-green-600' : 'bg-gray-300'}`}></div>
              <div className="text-sm font-bold text-green-900 mb-1">FreeAgent User Email</div>
              <div className="text-xs text-green-800 truncate font-medium" title={
                (user?.freeagentConnection?.isConnected || connections.freeagent.isConnected) 
                  ? (user?.email || 'Connected')
                  : 'Setup needed'
              }>
                {(user?.freeagentConnection?.isConnected || connections.freeagent.isConnected) 
                  ? (user?.email || 'Connected')
                  : 'Setup needed'}
              </div>
            </div>
            
            {/* Bank Account Status - FreeAgent Green Theme */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-300 rounded-lg p-4 text-center">
              <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${freeagentConnection.ebayAccountStatus.hasEbayAccount ? 'bg-green-600' : 'bg-gray-300'}`}></div>
              <div className="text-sm font-bold text-green-900 mb-1">FreeAgent Bank Account</div>
              <div className="text-xs text-green-800 truncate font-medium" title={
                freeagentConnection.ebayAccountStatus.hasEbayAccount 
                  ? (freeagentConnection.ebayAccountStatus.bankAccount?.name || 'eBay Sales Account')
                  : 'Setup needed'
              }>
                {freeagentConnection.ebayAccountStatus.hasEbayAccount 
                  ? (freeagentConnection.ebayAccountStatus.bankAccount?.name || 'eBay Sales Account')
                  : 'Setup needed'}
              </div>
            </div>

            {/* System Status - Neutral/Success Colors */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 rounded-lg p-4 text-center">
              <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${
                (user?.ebayConnection?.isConnected || connections.ebay.isConnected) && 
                (user?.freeagentConnection?.isConnected || connections.freeagent.isConnected) && 
                freeagentConnection.ebayAccountStatus.hasEbayAccount ? 'bg-green-600' : 'bg-yellow-500'
              }`}></div>
              <div className="text-sm font-bold text-gray-900 mb-1">System Status</div>
              <div className="text-xs text-gray-800 font-medium">
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