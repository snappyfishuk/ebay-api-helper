// EbayApiAccountingHelper.tsx
import React, { useState, useEffect } from "react";
import AccountInfo from "./components/AccountInfo";
import { SetupTab } from "./components/tabs/SetupTab";
import { ImportTab } from "./components/tabs/ImportTab";
import { TransactionsTab } from "./components/tabs/TransactionsTab";
import { FreeAgentEntriesTab } from "./components/tabs/FreeAgentEntriesTab";
import { ErrorMessage } from "./components/common/ErrorMessage";
import { LoadingIndicator } from "./components/common/LoadingIndicator";
import { 
  useEbayConnection, 
  useFreeAgentConnection, 
  useTransactions, 
  useSetupStatus 
} from "./hooks";
import { User, Connections } from "./types";

interface EbayApiAccountingHelperProps {
  user: User;
}

type TabId = 'setup' | 'import' | 'transactions' | 'entries';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: "setup", label: "Connections", icon: "🔗" },
  { id: "import", label: "Import & Sync", icon: "📥" },
  { id: "transactions", label: "Transactions", icon: "📊" },
  { id: "entries", label: "FreeAgent Entries", icon: "📋" },
];

// Trial Status Component
interface TrialData {
  subscriptionStatus: string;
  trialEndsAt: string;
  isTrialActive: boolean;
  hasActiveSubscription: boolean;
  daysRemaining: number | null;
}

const TrialStatusBanner: React.FC = () => {
  const [trialData, setTrialData] = useState<TrialData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrialStatus();
  }, []);

  const fetchTrialStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/users/subscription`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTrialData(data.data);
      }
    } catch (error) {
      console.error('Error fetching trial status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !trialData || trialData.subscriptionStatus !== 'trial') {
    return null;
  }

  const formatTimeRemaining = (daysRemaining: number) => {
    if (daysRemaining <= 0) return "Trial expired";
    if (daysRemaining === 1) return "1 day remaining";
    return `${daysRemaining} days remaining`;
  };

  const getStatusColor = (daysRemaining: number | null, isActive: boolean) => {
    if (!isActive || !daysRemaining) return "red";
    if (daysRemaining <= 2) return "red";
    if (daysRemaining <= 5) return "yellow";
    return "green";
  };

  const statusColor = getStatusColor(trialData.daysRemaining, trialData.isTrialActive);

  return (
    <div className={`rounded-lg border p-4 mb-6 ${
      statusColor === 'red'
        ? 'bg-red-50 border-red-200'
        : statusColor === 'yellow'
        ? 'bg-yellow-50 border-yellow-200'
        : 'bg-green-50 border-green-200'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">
            {statusColor === 'red' ? '⚠️' : statusColor === 'yellow' ? '⏰' : '✅'}
          </div>
          <div>
            <h3 className={`font-medium ${
              statusColor === 'red'
                ? 'text-red-900'
                : statusColor === 'yellow'
                ? 'text-yellow-900'
                : 'text-green-900'
            }`}>
              {trialData.isTrialActive ? 'Free Trial Active' : 'Trial Expired'}
            </h3>
            <p className={`text-sm ${
              statusColor === 'red'
                ? 'text-red-700'
                : statusColor === 'yellow'
                ? 'text-yellow-700'
                : 'text-green-700'
            }`}>
              {trialData.isTrialActive && trialData.daysRemaining
                ? `${formatTimeRemaining(trialData.daysRemaining)} in your free trial`
                : 'Your trial has ended. Upgrade to continue using all features.'}
            </p>
          </div>
        </div>
        
        {(!trialData.isTrialActive || (trialData.daysRemaining && trialData.daysRemaining <= 5)) && (
          <button className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            statusColor === 'red'
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-yellow-600 text-white hover:bg-yellow-700'
          }`}>
            Upgrade Now
          </button>
        )}
      </div>

      {trialData.isTrialActive && trialData.trialEndsAt && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Trial expires:</span>
            <span>
              {new Date(trialData.trialEndsAt).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Main component for eBay API Accounting Helper
 * CRITICAL: All original functionality is preserved with added type safety
 */
const EbayApiAccountingHelper: React.FC<EbayApiAccountingHelperProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<TabId>("setup");
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [globalLoading, setGlobalLoading] = useState(false);

  // Use custom hooks for connections
  const ebayConnection = useEbayConnection();
  const freeagentConnection = useFreeAgentConnection();

  // Combine connections for compatibility with existing logic
  const connections: Connections = {
    ebay: ebayConnection.connection,
    freeagent: freeagentConnection.connection,
  };

  // Use transactions hook
  const transactionsManager = useTransactions(ebayConnection.connection.isConnected);

  // Calculate setup status
  const setupStatus = useSetupStatus(connections, freeagentConnection.ebayAccountStatus);

  // Check connections on mount
  useEffect(() => {
    if (user) {
      checkAllConnections();
    }
  }, [user]);

  const checkAllConnections = async () => {
    await Promise.all([
      ebayConnection.checkConnection(),
      freeagentConnection.checkConnection(),
    ]);
  };

  // Combine errors from all sources
  const currentError = globalError || 
    ebayConnection.error || 
    freeagentConnection.error || 
    transactionsManager.error;

  // Combine loading states
  const isLoading = globalLoading || 
    ebayConnection.isLoading || 
    freeagentConnection.isLoading || 
    transactionsManager.isLoading;

  // Tab rendering functions (preserving all original logic)
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'setup':
        return (
          <SetupTab
            connections={connections}
            ebayAccountStatus={freeagentConnection.ebayAccountStatus}
            availableEbayAccounts={freeagentConnection.availableEbayAccounts}
            setupStatus={setupStatus}
            user={user}
            onConnectEbay={ebayConnection.connect}
            onDisconnectEbay={ebayConnection.disconnect}
            onConnectFreeAgent={freeagentConnection.connect}
            onDisconnectFreeAgent={freeagentConnection.disconnect}
            onCreateEbayAccount={freeagentConnection.createEbayAccount}
            onSelectEbayAccount={freeagentConnection.selectExistingEbayAccount}
            isLoading={isLoading}
          />
        );
      case 'import':
        return (
          <ImportTab
            connections={connections}
            setupStatus={setupStatus}
            ebayAccountStatus={freeagentConnection.ebayAccountStatus}
            selectedDateRange={transactionsManager.selectedDateRange}
            onStartDateChange={transactionsManager.handleStartDateChange}
            onEndDateChange={transactionsManager.handleEndDateChange}
            onSetDatePreset={transactionsManager.setDatePreset}
            onFetchTransactions={transactionsManager.fetchTransactions}
            onSyncToFreeAgent={() => 
              transactionsManager.syncToFreeAgent(freeagentConnection.ebayAccountStatus)
            }
            onExportCsv={transactionsManager.exportToCsv}
            processedData={transactionsManager.processedData}
            syncStatus={transactionsManager.syncStatus}
            isLoading={isLoading}
          />
        );
      case 'transactions':
        return (
          <TransactionsTab
            transactions={transactionsManager.transactions}
          />
        );
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <AccountInfo />

        {/* Trial Status Banner */}
        <TrialStatusBanner />

        {/* Global Error Display */}
        {currentError && (
          <ErrorMessage
            error={currentError}
            onDismiss={() => {
              setGlobalError(null);
              ebayConnection.error && ebayConnection.checkConnection();
              freeagentConnection.error && freeagentConnection.checkConnection();
            }}
          />
        )}

        {/* Global Loading Indicator */}
        {isLoading && <LoadingIndicator />}

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8 justify-center">
            {TABS.map((tab) => (
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

        {/* Active Tab Content */}
        <div className="tab-content">
          {renderActiveTab()}
        </div>

        {/* Footer Status Section - EXACTLY as original */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Streamlined Production Integration
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
                <div className="font-medium text-gray-900">eBay Account</div>
                <div
                  className={`px-2 py-1 rounded text-xs ${
                    freeagentConnection.ebayAccountStatus.hasEbayAccount
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {freeagentConnection.ebayAccountStatus.hasEbayAccount
                    ? "Ready"
                    : "Setup Required"}
                </div>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <div className="text-2xl">📊</div>
                <div className="font-medium text-gray-900">Enhanced Data</div>
                <div className="text-gray-600">
                  {transactionsManager.transactions.length} transactions with rich descriptions
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>Streamlined Setup:</strong> Auto-creates dedicated eBay
                Sales account, eliminates manual bank account selection, follows
                FreeAgent best practices. Each user connects their own eBay
                account for complete data isolation.
              </p>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-center space-x-2">
                <span className="text-sm font-medium text-gray-700">
                  Setup Status:
                </span>
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    setupStatus.readyToSync
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
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