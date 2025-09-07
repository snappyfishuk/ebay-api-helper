// EbayApiAccountingHelper.tsx - Reorganized with Clear Dashboard Structure
import React, { useState, useEffect } from "react";
import { 
  useEbayConnection, 
  useFreeAgentConnection, 
  useTransactions, 
  useSetupStatus 
} from "./hooks";
import { User, Connections } from "./types";
import { SetupTab } from "./components/tabs/SetupTab";
import { ManualSyncTab } from "./components/tabs/ManualSyncTab";
import { AutoSyncTab } from "./components/tabs/AutoSyncTab";

interface EbayApiAccountingHelperProps {
  user: User;
}

type TabId = 'dashboard' | 'setup' | 'manual-sync' | 'auto-sync';

// Minimal Trial Alert
const TrialAlert: React.FC = () => {
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

  if (!trialData || trialData.subscriptionStatus !== 'trial' || 
      (trialData.daysRemaining && trialData.daysRemaining > 5)) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-yellow-800">
          Trial ends in {trialData.daysRemaining} day{trialData.daysRemaining === 1 ? '' : 's'}
        </span>
        <button className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700">
          Upgrade
        </button>
      </div>
    </div>
  );
};

// Dashboard Tab - Overview and Navigation
const DashboardTab: React.FC<{
  user?: User;
  connections: Connections;
  ebayAccountStatus: any;
  setupStatus: any;
  onNavigateToTab: (tab: TabId) => void;
}> = ({ user, connections, ebayAccountStatus, setupStatus, onNavigateToTab }) => {
  
  return (
    <div className="space-y-6">
      {/* Enhanced Combined Status Section */}
      <div className="bg-gradient-to-r from-blue-50 via-green-50 to-purple-50 border-2 border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Connection Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* eBay Status */}
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
          
          {/* FreeAgent Status */}
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
          
          {/* Bank Account Status */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-lg p-4 text-center">
            <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${ebayAccountStatus.hasEbayAccount ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
            <div className="text-sm font-bold text-purple-800 mb-1">FreeAgent Bank Account</div>
            <div className="text-xs text-purple-700 truncate font-medium" title={
              ebayAccountStatus.hasEbayAccount 
                ? (ebayAccountStatus.bankAccount?.name || 'eBay Sales Account')
                : 'Setup needed'
            }>
              {ebayAccountStatus.hasEbayAccount 
                ? (ebayAccountStatus.bankAccount?.name || 'eBay Sales Account')
                : 'Setup needed'}
            </div>
          </div>

          {/* System Ready Status */}
          <div className="bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-200 rounded-lg p-4 text-center">
            <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${
              (user?.ebayConnection?.isConnected || connections.ebay.isConnected) && 
              (user?.freeagentConnection?.isConnected || connections.freeagent.isConnected) && 
              ebayAccountStatus.hasEbayAccount ? 'bg-green-600' : 'bg-yellow-500'
            }`}></div>
            <div className="text-sm font-bold text-gray-800 mb-1">System Status</div>
            <div className="text-xs text-gray-700 font-medium">
              {(user?.ebayConnection?.isConnected || connections.ebay.isConnected) && 
               (user?.freeagentConnection?.isConnected || connections.freeagent.isConnected) && 
               ebayAccountStatus.hasEbayAccount ? 'Ready to Sync' : 'Setup Required'}
            </div>
          </div>
        </div>
      </div>

      {/* Action Cards - Navigate to Different Workflows */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Setup Card */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 transition-colors cursor-pointer"
             onClick={() => onNavigateToTab('setup')}>
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Setup & Configuration</h3>
              <p className="text-sm text-gray-600">Connect eBay and FreeAgent accounts</p>
            </div>
          </div>
          <div className="text-sm text-blue-600 font-medium">
            {setupStatus.readyToSync ? '✓ Setup Complete' : 'Setup Required →'}
          </div>
        </div>

        {/* Manual Sync Card */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-green-300 transition-colors cursor-pointer"
             onClick={() => onNavigateToTab('manual-sync')}>
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Manual Sync</h3>
              <p className="text-sm text-gray-600">Import transactions manually when needed</p>
            </div>
          </div>
          <div className="text-sm text-green-600 font-medium">
            {setupStatus.readyToSync ? 'Import & Sync →' : 'Setup Required First'}
          </div>
        </div>

        {/* Auto Sync Card */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-purple-300 transition-colors cursor-pointer"
             onClick={() => onNavigateToTab('auto-sync')}>
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Auto-Sync</h3>
              <p className="text-sm text-gray-600">Automated daily sync at 2:00 AM UK time</p>
            </div>
          </div>
          <div className="text-sm text-purple-600 font-medium">
            {setupStatus.readyToSync ? 'Configure Auto-Sync →' : 'Setup Required First'}
          </div>
        </div>
      </div>

      {/* Quick Stats Section */}
      {setupStatus.readyToSync && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">0</div>
              <div className="text-blue-800 text-sm">Transactions Today</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">0</div>
              <div className="text-green-800 text-sm">Manual Syncs</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {user?.autoSync?.enabled ? 'Enabled' : 'Disabled'}
              </div>
              <div className="text-purple-800 text-sm">Auto-Sync Status</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const EbayApiAccountingHelper: React.FC<EbayApiAccountingHelperProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  
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

      // Debug user data
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

  const renderTab = () => {
    const commonProps = {
      connections,
      setupStatus,
      ebayAccountStatus: freeagentConnection.ebayAccountStatus,
      isLoading: ebayConnection.isLoading || freeagentConnection.isLoading || transactionsManager.isLoading,
    };

    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardTab
            user={user}
            connections={connections}
            ebayAccountStatus={freeagentConnection.ebayAccountStatus}
            setupStatus={setupStatus}
            onNavigateToTab={setActiveTab}
          />
        );
      case 'setup':
        return (
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
        );
      case 'manual-sync':
        return (
          <ManualSyncTab
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
            transactions={transactionsManager.transactions}
          />
        );
      case 'auto-sync':
        return (
          <AutoSyncTab
            {...commonProps}
            user={user}
          />
        );
      default:
        return null;
    }
  };

  const error = ebayConnection.error || freeagentConnection.error || transactionsManager.error;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* App Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent mb-2">
            eBay FreeAgent Sync
          </h1>
          <p className="text-gray-600 text-sm">
            Automated eBay transaction sync with FreeAgent accounting
          </p>
        </div>
        
        <TrialAlert />

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

        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="flex space-x-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
              { id: 'setup', label: 'Setup', icon: '⚙️' },
              { id: 'manual-sync', label: 'Manual Sync', icon: '📥' },
              { id: 'auto-sync', label: 'Auto-Sync', icon: '🔄' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabId)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          {renderTab()}
        </div>

      </div>
    </div>
  );
};

export default EbayApiAccountingHelper;