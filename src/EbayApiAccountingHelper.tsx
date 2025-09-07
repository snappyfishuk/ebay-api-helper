// EbayApiAccountingHelper.tsx - Original Working Structure with Visual Improvements
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

type TabId = 'setup' | 'import' | 'transactions' | 'entries';

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

  // Get current user email for test user detection
  const userEmail = localStorage.getItem('userEmail') || 
    JSON.parse(localStorage.getItem('user') || '{}').email;
  
  const isTestUser = userEmail === 'gary.arnold@hotmail.co.uk';

  // Show test user banner
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

  // Regular trial logic for non-test users
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
  const [activeTab, setActiveTab] = useState<TabId>("setup");
  
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
      case 'import':
        return (
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
        );
      case 'transactions':
        return <TransactionsTab transactions={transactionsManager.transactions} />;
      case 'entries':
        return (
          <FreeAgentEntriesTab
            processedData={transactionsManager.processedData}
            ebayAccountStatus={freeagentConnection.ebayAccountStatus}
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
        
        {/* App Header with Branding */}
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

        {/* Enhanced Status Cards with Brand Colors */}
        <div className="bg-gradient-to-r from-blue-50 via-green-50 to-purple-50 border-2 border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Connection Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* eBay Status - eBay Colors */}
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
            
            {/* FreeAgent Status - FreeAgent Colors */}
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
            
            {/* Bank Account Status - Purple Theme */}
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

            {/* System Ready Status */}
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

        {/* Original Tab Navigation - Keep Working */}
        <div className="mb-6">
          <div className="flex space-x-2">
            {[
              { id: 'setup', label: 'Setup' },
              { id: 'import', label: 'Import & Sync' },
              { id: 'transactions', label: 'Transactions' },
              { id: 'entries', label: 'FreeAgent Entries' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabId)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border'
                }`}
              >
                {tab.label}
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