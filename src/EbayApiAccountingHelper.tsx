// EbayApiAccountingHelper.tsx - Clean & Modular
import React, { useState, useEffect, useRef } from "react";
// NEW (works without index.ts):
import { useEbayConnection } from "./hooks/useEbayConnection";
import { useFreeAgentConnection } from "./hooks/useFreeAgentConnection";
import { useTransactions } from "./hooks/useTransactions";
import { useSetupStatus } from "./hooks/useSetupStatus";
import { User, Connections } from "./types";
import { ConnectionStatusCards } from "./components/ConnectionStatusCards";
import { TrialAlert } from "./components/TrialAlert";
import { DashboardTab } from "./components/tabs/DashboardTab";
import { AutoSyncTab } from "./components/tabs/AutoSyncTab";
import { ImportTab } from "./components/tabs/ImportTab";
import { TransactionsTab } from "./components/tabs/TransactionsTab";
import { FreeAgentEntriesTab } from "./components/tabs/FreeAgentEntriesTab";
import SettingsTab from "./components/tabs/SettingsTab";

interface EbayApiAccountingHelperProps {
  user: User;
}

type NavigationId = 'dashboard' | 'autosync' | 'manual' | 'history' | 'settings';

const EbayApiAccountingHelper: React.FC<EbayApiAccountingHelperProps> = ({ user }) => {
  const [activeNav, setActiveNav] = useState<NavigationId>("dashboard");
  const hasInitialized = useRef(false);
  
  // Custom hooks
  const ebayConnection = useEbayConnection();
  const freeagentConnection = useFreeAgentConnection();
  const transactionsManager = useTransactions(ebayConnection.connection.isConnected);
  
  // Connection status aggregation
  const connections: Connections = {
    ebay: ebayConnection.connection,
    freeagent: freeagentConnection.connection,
  };
  
  const setupStatus = useSetupStatus(connections, freeagentConnection.ebayAccountStatus);
  
  // Error aggregation
  const error = ebayConnection.error || freeagentConnection.error || transactionsManager.error;

// Initialize connections on mount - FIXED to prevent infinite API calls
  useEffect(() => {
    if (user && !hasInitialized.current) {
      hasInitialized.current = true;
      
      // Only call these once when user is available
      ebayConnection.checkConnection();
      freeagentConnection.checkConnection();

      console.log("USER DATA CHECK:", {
        hasUser: !!user,
        email: user?.email,
        ebayConnected: user?.ebayConnection?.isConnected,
        ebayEnvironment: user?.ebayConnection?.environment,
        ebayUsername: user?.ebayConnection?.username,
        ebayUserId: user?.ebayConnection?.userId
      });
    }
  }, [user?.id]); // FIXED: Only depend on user.id

  // Handle FreeAgent OAuth callback and trigger eBay account check
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Handle FreeAgent connection success
    if (urlParams.get('freeagent_connected') === 'true') {
      console.log("FreeAgent connected via URL parameter!");
      
      // Trigger the connection check that will then check eBay account status
      freeagentConnection.checkConnection();
      
      // Clean the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [freeagentConnection]);

  // Use correct property name from SetupStatus type
  useEffect(() => {
    if (!setupStatus.ebayAccountReady && freeagentConnection.connection.isConnected) {
      console.log("eBay account needed - user should create one");
      // The existing UI will show the bank account setup in ConnectionStatusCards
    }
  }, [setupStatus.ebayAccountReady, freeagentConnection.connection.isConnected]);

  // Navigation content renderer
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
          <DashboardTab
            setupStatus={setupStatus}
            user={user}
            connections={connections}
            freeagentConnection={freeagentConnection}
            ebayConnection={ebayConnection}
            setActiveNav={setActiveNav}
          />
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
              isLoading={commonProps.isLoading}
            />
          </div>
        );
        
      case 'manual':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Manual Sync CSV</h3>
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
            
            {/* eBay Transactions */}
            <div className="bg-white border rounded-lg">
              <div className="p-4 border-b bg-gray-50">
                <h4 className="text-md font-semibold text-gray-900">eBay Transactions</h4>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <TransactionsTab transactions={transactionsManager.transactions} />
              </div>
            </div>
            
            {/* FreeAgent Entries */}
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

      case 'settings':
        return <SettingsTab user={user} />;
        
      default:
        return null;
    }
  };

  // Error retry handler
  const handleRetry = () => {
    if (ebayConnection.error) ebayConnection.checkConnection();
    if (freeagentConnection.error) freeagentConnection.checkConnection();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Trial/Test Account Alert */}
        <TrialAlert user={user} />

        {/* Global Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-red-800 text-sm">{error}</span>
              <button 
                onClick={handleRetry}
                className="text-red-600 text-xs hover:text-red-800"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Connection Status Cards */}
        <ConnectionStatusCards
          user={user}
          connections={connections}
          freeagentConnection={freeagentConnection}
          ebayConnection={ebayConnection}
        />

        {/* Navigation */}
        <div className="mb-6">
          <div className="flex space-x-2 justify-center">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
              { id: 'autosync', label: 'Auto-Sync', icon: '⚡' },
              { id: 'manual', label: 'Manual-Sync', icon: '🔧' },
              { id: 'history', label: 'Transaction History', icon: '📊' },
              { id: 'settings', label: 'Settings', icon: '⚙️' },
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

        {/* Main Content Area */}
        <div className="bg-white rounded-lg border p-6">
          {renderContent()}
        </div>

      </div>
    </div>
  );
};

export default EbayApiAccountingHelper;