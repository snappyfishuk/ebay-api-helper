// components/tabs/ManualSyncTab.tsx - All Manual Tools Consolidated
import React, { useState } from 'react';
import {
  Connections,
  SetupStatus,
  EbayAccountStatus,
  DateRange,
  ProcessedTransactionData,
  EbayTransaction,
} from '../../types';
import { formatUKDate } from '../../utils/formatters';
import { TransactionService } from '../../services/TransactionService';

interface ManualSyncTabProps {
  connections: Connections;
  setupStatus: SetupStatus;
  ebayAccountStatus: EbayAccountStatus;
  selectedDateRange: DateRange;
  onStartDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEndDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSetDatePreset: (days: number) => void;
  onFetchTransactions: () => Promise<void>;
  onSyncToFreeAgent: () => Promise<void>;
  onExportCsv: () => void;
  processedData: ProcessedTransactionData | null;
  syncStatus: string | null;
  transactions: EbayTransaction[];
  isLoading: boolean;
}

type ManualTabView = 'import' | 'transactions' | 'entries';

export const ManualSyncTab: React.FC<ManualSyncTabProps> = ({
  connections,
  setupStatus,
  ebayAccountStatus,
  selectedDateRange,
  onStartDateChange,
  onEndDateChange,
  onSetDatePreset,
  onFetchTransactions,
  onSyncToFreeAgent,
  onExportCsv,
  processedData,
  syncStatus,
  transactions,
  isLoading,
}) => {
  const [activeView, setActiveView] = useState<ManualTabView>('import');
  const transactionService = new TransactionService();

  // Import & Sync View
  const ImportSyncView = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-50 to-green-50 border-2 border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-blue-800 mb-4">
          Import eBay Transactions
        </h3>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => onSetDatePreset(7)}
            className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 rounded font-medium"
          >
            Last 7 days
          </button>
          <button
            onClick={() => onSetDatePreset(30)}
            className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 rounded font-medium"
          >
            Last 30 days
          </button>
          <button
            onClick={() => onSetDatePreset(90)}
            className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 rounded font-medium"
          >
            Last 90 days
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-bold text-blue-800 mb-2">
              Start Date
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border-2 border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedDateRange.startDate}
              onChange={onStartDateChange}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-blue-800 mb-2">
              End Date
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border-2 border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedDateRange.endDate}
              onChange={onEndDateChange}
              max={new Date().toISOString().split("T")[0]}
              min={selectedDateRange.startDate}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <button
            onClick={onFetchTransactions}
            disabled={!connections.ebay.isConnected || isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 font-medium"
          >
            {isLoading && (
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            )}
            <span>{isLoading ? "Fetching..." : "Fetch eBay Transactions"}</span>
          </button>

          {processedData && processedData.freeAgentEntries.length > 0 && (
            <>
              <button
                onClick={onSyncToFreeAgent}
                disabled={!setupStatus.readyToSync || isLoading}
                className={`px-6 py-2 rounded-md transition-colors flex items-center space-x-2 font-medium ${
                  setupStatus.readyToSync
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-gray-400 text-white cursor-not-allowed"
                }`}
              >
                <span>
                  Sync to FreeAgent ({processedData.freeAgentEntries.length})
                </span>
                {setupStatus.readyToSync && (
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
              <button
                onClick={onExportCsv}
                className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors font-medium"
              >
                Export CSV
              </button>
            </>
          )}
        </div>

        {!setupStatus.readyToSync && (
          <div className="mt-6 bg-yellow-100 border border-yellow-300 rounded-lg p-4">
            <h4 className="font-bold text-yellow-900 mb-2">Setup Required</h4>
            <p className="text-yellow-800 text-sm">
              {(() => {
                const missing = [];
                if (!connections.ebay.isConnected) missing.push("Connect eBay");
                if (!connections.freeagent.isConnected)
                  missing.push("Connect FreeAgent");
                if (!ebayAccountStatus.hasEbayAccount)
                  missing.push("Set up eBay account");
                return `Please complete setup first: ${missing.join(", ")}.`;
              })()}
            </p>
          </div>
        )}

        {setupStatus.readyToSync && ebayAccountStatus.hasEbayAccount && (
          <div className="mt-6 p-4 bg-green-100 border border-green-300 rounded-lg">
            <div className="flex items-center">
              <svg
                className="h-5 w-5 text-green-600 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-green-800 font-bold">Ready to Sync</p>
                <p className="text-green-700 text-sm">
                  Transactions will sync to:{" "}
                  <strong>
                    {ebayAccountStatus.bankAccount?.name || "eBay Sales"}
                  </strong>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {syncStatus && (
        <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
          <div className="flex items-center">
            <svg
              className="h-5 w-5 text-blue-600 mr-3"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-blue-800 font-bold">Sync Status</p>
              <p className="text-blue-700 text-sm">{syncStatus}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Transactions View
  const TransactionsView = () => (
    <div className="space-y-6">
      {transactions.length > 0 ? (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-blue-800">
              eBay Transactions ({transactions.length})
            </h3>
            <div className="bg-blue-100 border border-blue-300 px-3 py-1 rounded-full text-sm font-medium text-blue-800">
              Enhanced Descriptions
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-blue-800 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-blue-800 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-blue-800 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-blue-800 uppercase tracking-wider">
                    Enhanced Description
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((txn, index) => {
                  const amount = parseFloat(txn.amount?.value?.toString() || '0');
                  const isDebit = txn.bookingEntry === "DEBIT" || 
                                 ['WITHDRAWAL', 'NON_SALE_CHARGE', 'REFUND'].includes(txn.transactionType) || 
                                 amount < 0;
                  const description = transactionService.generateEnhancedTransactionDescription(txn);
                  
                  return (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatUKDate(txn.transactionDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {txn.transactionType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={isDebit ? "text-red-600" : "text-green-600"}>
                          {txn.amount?.currencyCode}{" "}
                          {Math.abs(amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div
                          className="max-w-xs truncate font-medium"
                          title={description}
                        >
                          {description}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border-2 border-gray-200 p-12 text-center">
          <div className="text-gray-400 text-4xl mb-4">📊</div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            No Transactions Found
          </h3>
          <p className="text-gray-600">
            Use the Import tab to fetch eBay transactions first.
          </p>
        </div>
      )}
    </div>
  );

  // FreeAgent Entries View
  const FreeAgentEntriesView = () => (
    <div className="space-y-6">
      {processedData?.freeAgentEntries?.length ? (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-green-800">
              FreeAgent Entries ({processedData.freeAgentEntries.length})
            </h3>
            <div className="flex items-center space-x-2">
              <div className="bg-green-100 border border-green-300 px-3 py-1 rounded-full text-sm font-medium text-green-800">
                Ready for Sync
              </div>
              {ebayAccountStatus.hasEbayAccount && (
                <div className="bg-purple-100 border border-purple-300 px-3 py-1 rounded-full text-sm font-medium text-purple-800">
                  → {ebayAccountStatus.bankAccount?.name || "eBay Sales"}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">
                {processedData.freeAgentEntries.length}
              </div>
              <div className="text-blue-800 text-sm font-medium">Total Transactions</div>
            </div>
            <div className="bg-green-100 border border-green-300 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                {processedData.creditCount}
              </div>
              <div className="text-green-800 text-sm font-medium">Credits (Income)</div>
            </div>
            <div className="bg-red-100 border border-red-300 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-600">
                {processedData.debitCount}
              </div>
              <div className="text-red-800 text-sm font-medium">Debits (Fees/Refunds)</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-green-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-green-800 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-green-800 uppercase tracking-wider">
                    Enhanced Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-green-800 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-green-800 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-green-800 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {processedData.freeAgentEntries.map((entry, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatUKDate(entry.dated_on)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <div
                        className="truncate font-medium"
                        title={entry.description}
                      >
                        {entry.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                        {entry.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          entry.isDebit
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {entry.isDebit ? "Debit" : "Credit"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={entry.isDebit ? "text-red-600" : "text-green-600"}>
                        {entry.isDebit ? "-" : "+"}£{Math.abs(entry.amount).toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border-2 border-gray-200 p-12 text-center">
          <div className="text-gray-400 text-4xl mb-4">📋</div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            No Entries Generated
          </h3>
          <p className="text-gray-600">
            Import eBay transactions first to generate FreeAgent entries.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Sub-Navigation */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-gray-200 rounded-xl p-4">
        <div className="flex space-x-2">
          {[
            { id: 'import', label: 'Import & Sync', icon: '📥' },
            { id: 'transactions', label: 'Raw Transactions', icon: '📊' },
            { id: 'entries', label: 'FreeAgent Entries', icon: '📋' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as ManualTabView)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center space-x-2 ${
                activeView === tab.id
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

      {/* Content based on active view */}
      {activeView === 'import' && <ImportSyncView />}
      {activeView === 'transactions' && <TransactionsView />}
      {activeView === 'entries' && <FreeAgentEntriesView />}
    </div>
  );
};