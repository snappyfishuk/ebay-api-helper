// EbayApiAccountingHelper.tsx - Ultra Clean Version
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

// Minimal Trial Alert - Only shows when urgent
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

  // Only show if trial expires soon
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

// Enhanced Status Cards with user details
const StatusCards: React.FC<{ 
  ebayConnected: boolean; 
  freeagentConnected: boolean; 
  ebayAccountReady: boolean;
  bankAccountName?: string;
  ebayUsername?: string;
  userEmail?: string;
}> = ({ ebayConnected, freeagentConnected, ebayAccountReady, bankAccountName, ebayUsername, userEmail }) => (
  <div className="grid grid-cols-3 gap-4 mb-6">
    <div className="bg-white border rounded-lg p-4 text-center">
      <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${ebayConnected ? 'bg-green-500' : 'bg-gray-300'}`}></div>
      <div className="text-sm font-medium">eBay</div>
      <div className="text-xs text-gray-500">
        {ebayConnected ? (ebayUsername || 'Connected') : 'Setup needed'}
      </div>
    </div>
    
    <div className="bg-white border rounded-lg p-4 text-center">
      <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${freeagentConnected ? 'bg-green-500' : 'bg-gray-300'}`}></div>
      <div className="text-sm font-medium">FreeAgent</div>
      <div className="text-xs text-gray-500">
        {freeagentConnected ? (userEmail || 'Connected') : 'Setup needed'}
      </div>
    </div>
    
    <div className="bg-white border rounded-lg p-4 text-center">
      <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${ebayAccountReady ? 'bg-green-500' : 'bg-gray-300'}`}></div>
      <div className="text-sm font-medium">Bank Account</div>
      <div className="text-xs text-gray-500">
        {ebayAccountReady ? (bankAccountName || 'eBay Sales') : 'Setup needed'}
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

        <StatusCards 
          ebayConnected={connections.ebay.isConnected}
          freeagentConnected={connections.freeagent.isConnected}
          ebayAccountReady={freeagentConnection.ebayAccountStatus.hasEbayAccount}
          bankAccountName={freeagentConnection.ebayAccountStatus.bankAccount?.name}
          ebayUsername={ebayConnection.connection.userId}
          userEmail={user.email}
        />

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