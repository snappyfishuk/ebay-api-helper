// EbayApiAccountingHelper.tsx - Clean Focused Version
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

// Trial Status Component - Simplified
interface TrialData {
  subscriptionStatus: string;
  isTrialActive: boolean;
  daysRemaining: number | null;
}

const TrialAlert: React.FC = () => {
  const [trialData, setTrialData] = useState<TrialData | null>(null);

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

  // Only show if trial expires soon or expired
  if (!trialData || trialData.subscriptionStatus !== 'trial' || 
      (trialData.daysRemaining && trialData.daysRemaining > 5)) {
    return null;
  }

  const isUrgent = !trialData.isTrialActive || (trialData.daysRemaining && trialData.daysRemaining <= 2);

  return (
    <div className={`p-3 rounded-lg mb-4 ${isUrgent ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${isUrgent ? 'text-red-800' : 'text-yellow-800'}`}>
          {trialData.isTrialActive 
            ? `Trial ends in ${trialData.daysRemaining} day${trialData.daysRemaining === 1 ? '' : 's'}`
            : 'Trial expired'
          }
        </span>
        <button className={`px-3 py-1 text-xs rounded ${isUrgent ? 'bg-red-600 text-white' : 'bg-yellow-600 text-white'}`}>
          Upgrade
        </button>
      </div>
    </div>
  );
};

// Minimal Header
const Header: React.FC<{ user: User; connections: Connections; readyToSync: boolean }> = ({ 
  user, connections, readyToSync 
}) => (
  <div className="bg-white rounded-lg border p-4 mb-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <h1 className="text-lg font-semibold text-gray-900">eBay API Helper</h1>
        <span className="text-sm text-gray-500">{user.email}</span>
      </div>
      <div className="flex items-center space-x-3">
        <div className={`w-2 h-2 rounded-full ${connections.ebay.isConnected ? 'bg-green-500' : 'bg-gray-300'}`}></div>
        <div className={`w-2 h-2 rounded-full ${connections.freeagent.isConnected ? 'bg-green-500' : 'bg-gray-300'}`}></div>
        <span className={`px-2 py-1 text-xs rounded ${readyToSync ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
          {readyToSync ? 'Ready' : 'Setup'}
        </span>
      </div>
    </div>
  </div>
);

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
        <Header user={user} connections={connections} readyToSync={setupStatus.readyToSync} />
        <TrialAlert />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="flex justify-between items-start">
              <p className="text-red-800 text-sm">{error}</p>
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

        {setupStatus.readyToSync && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {transactionsManager.transactions.length} transactions processed
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EbayApiAccountingHelper;