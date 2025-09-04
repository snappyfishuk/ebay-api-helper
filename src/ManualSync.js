// pages/ManualSync.js - FOCUSED on actual syncing functionality
import React, { useState } from "react";
import { Calendar, Download, Upload, RefreshCw } from "lucide-react";

// Import smaller, focused components
import ConnectionStatus from "../components/ConnectionStatus";
import DateRangePicker from "../components/DateRangePicker";
import TransactionTable from "../components/TransactionTable";
import SyncButton from "../components/SyncButton";
import ProcessedDataView from "../components/ProcessedDataView";

// Import custom hooks for logic separation
import { useConnections } from "../hooks/useConnections";
import { useTransactionSync } from "../hooks/useTransactionSync";
import { useDateRange } from "../hooks/useDateRange";

const ManualSync = ({ user }) => {
  // Simplified state - most logic moved to custom hooks
  const [activeTab, setActiveTab] = useState("fetch");

  // Custom hooks handle the complex logic
  const { connections, setupStatus, checkConnectionStatus } =
    useConnections(user);
  const {
    transactions,
    processedData,
    syncStatus,
    isLoading,
    error,
    setError,
    fetchTransactions,
    syncToFreeAgent,
    exportToCsv,
  } = useTransactionSync(connections, setupStatus);

  const {
    selectedDateRange,
    handleStartDateChange,
    handleEndDateChange,
    setDatePreset,
  } = useDateRange();

  // Simple render functions instead of massive components
  const renderFetchTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Fetch eBay Transactions
        </h3>

        {/* Connection Status - Simple component */}
        <ConnectionStatus
          connections={connections}
          setupStatus={setupStatus}
          onCheckStatus={checkConnectionStatus}
        />

        {/* Date Range Picker - Extracted component */}
        <DateRangePicker
          selectedDateRange={selectedDateRange}
          onStartDateChange={handleStartDateChange}
          onEndDateChange={handleEndDateChange}
          onPresetSelect={setDatePreset}
        />

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mt-6">
          <button
            onClick={() => fetchTransactions(selectedDateRange)}
            disabled={!setupStatus.canFetch || isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center space-x-2"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>{isLoading ? "Fetching..." : "Fetch Transactions"}</span>
          </button>
        </div>
      </div>

      {/* Results */}
      {transactions.length > 0 && (
        <TransactionTable transactions={transactions} />
      )}
    </div>
  );

  const renderSyncTab = () => (
    <div className="space-y-6">
      {processedData ? (
        <>
          <ProcessedDataView processedData={processedData} />

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex flex-wrap gap-4">
              <SyncButton
                onSync={syncToFreeAgent}
                disabled={!setupStatus.canSync || isLoading}
                isLoading={isLoading}
                entryCount={processedData.freeAgentEntries.length}
              />

              <button
                onClick={exportToCsv}
                className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Data to Sync
          </h3>
          <p className="text-gray-600">
            Fetch transactions first to prepare them for sync
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manual Sync</h1>
          <p className="text-gray-600">
            Fetch eBay transactions and sync them to FreeAgent
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex justify-between items-start">
              <div className="text-red-800">{error}</div>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Success Status */}
        {syncStatus && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="text-green-800">{syncStatus}</div>
          </div>
        )}

        {/* Simple Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8 justify-center">
            {[
              { id: "fetch", label: "Fetch Data", icon: Download },
              { id: "sync", label: "Sync to FreeAgent", icon: Upload },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-gray-200"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === "fetch" && renderFetchTab()}
          {activeTab === "sync" && renderSyncTab()}
        </div>
      </div>
    </div>
  );
};

export default ManualSync;
