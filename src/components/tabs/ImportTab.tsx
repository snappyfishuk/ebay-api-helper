// components/tabs/ImportTab.tsx
import React, { useState } from 'react';
import {
  Connections,
  SetupStatus,
  EbayAccountStatus,
  DateRange,
  ProcessedTransactionData,
  EbayTransaction,
} from '../../types';
import { TransactionsTab } from './TransactionsTab';
import { FreeAgentEntriesTab } from './FreeAgentEntriesTab';

interface ImportTabProps {
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
  isLoading: boolean;
  transactions?: EbayTransaction[];
}

export const ImportTab: React.FC<ImportTabProps> = ({
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
  isLoading,
  transactions = [],
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'sync' | 'history'>('sync');

  return (
    <div className="space-y-6">
      {/* Sub-navigation for Manual Sync */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveSubTab('sync')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
            activeSubTab === 'sync'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Manual Sync & CSV Export
        </button>
        <button
          onClick={() => setActiveSubTab('history')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
            activeSubTab === 'history'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Transaction History
        </button>
      </div>

      {activeSubTab === 'sync' ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Manual Sync - No Limits
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Fetch eBay transactions for any date range and export to CSV or sync directly to FreeAgent.
            <span className="font-medium text-green-600 ml-1">No 90-day restriction!</span>
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => onSetDatePreset(7)}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              Last 7 days
            </button>
            <button
              onClick={() => onSetDatePreset(30)}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              Last 30 days
            </button>
            <button
              onClick={() => onSetDatePreset(90)}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              Last 90 days
            </button>
            <button
              onClick={() => onSetDatePreset(180)}
              className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 rounded text-blue-700 font-medium"
            >
              Last 6 months
            </button>
            <button
              onClick={() => onSetDatePreset(365)}
              className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 rounded text-blue-700 font-medium"
            >
              Last year
            </button>
            <button
              onClick={() => onSetDatePreset(730)}
              className="px-3 py-1 text-sm bg-purple-100 hover:bg-purple-200 rounded text-purple-700 font-medium"
            >
              Last 2 years
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedDateRange.startDate}
                onChange={onStartDateChange}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedDateRange.endDate}
                onChange={onEndDateChange}
                max={new Date().toISOString().split("T")[0]}
                min={selectedDateRange.startDate}
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
            <div className="flex items-center space-x-2 text-sm">
              <svg className="h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="text-blue-700">
                Selected range: <strong>
                  {Math.ceil((new Date(selectedDateRange.endDate).getTime() - new Date(selectedDateRange.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} days
                </strong> 
                ({new Date(selectedDateRange.startDate).toLocaleDateString('en-GB')} to {new Date(selectedDateRange.endDate).toLocaleDateString('en-GB')})
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={onFetchTransactions}
              disabled={!connections.ebay.isConnected || isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
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
              <span>{isLoading ? "Fetching..." : "Fetch All eBay Transactions"}</span>
            </button>

            {processedData && processedData.freeAgentEntries.length > 0 && (
              <>
                <button
                  onClick={onSyncToFreeAgent}
                  disabled={!setupStatus.readyToSync || isLoading}
                  className={`px-6 py-2 rounded-md transition-colors flex items-center space-x-2 ${
                    setupStatus.readyToSync
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-gray-400 text-white cursor-not-allowed"
                  }`}
                >
                  <span>
                    Upload to eBay Sales Account (
                    {processedData.freeAgentEntries.length})
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
                  className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  Export CSV
                </button>
              </>
            )}
          </div>

          {!setupStatus.readyToSync && (
            <div className="mt-6 bg-yellow-50 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">Setup Required</h4>
              <p className="text-yellow-800 text-sm">
                {(() => {
                  const missing = [];
                  if (!connections.ebay.isConnected) missing.push("Connect eBay");
                  if (!connections.freeagent.isConnected)
                    missing.push("Connect FreeAgent");
                  if (!ebayAccountStatus.hasEbayAccount)
                    missing.push("Set up eBay account");
                  return `Please complete: ${missing.join(", ")}.`;
                })()}
              </p>
            </div>
          )}

          {setupStatus.readyToSync && ebayAccountStatus.hasEbayAccount && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 text-green-400 mr-2"
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
                  <p className="text-green-800 font-medium">Ready to Sync</p>
                  <p className="text-green-600 text-sm">
                    Transactions will sync to:{" "}
                    <strong>
                      {ebayAccountStatus.bankAccount?.name || "eBay Sales"}
                    </strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {syncStatus && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 text-blue-400 mr-3"
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
                  <p className="text-blue-800 font-medium">Sync Status</p>
                  <p className="text-blue-700 text-sm">{syncStatus}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white border rounded-lg">
            <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
              <h4 className="text-md font-semibold text-gray-900">eBay Transactions</h4>
              {transactions.length > 0 && (
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                  {transactions.length} transactions
                </span>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              <TransactionsTab transactions={transactions} />
            </div>
          </div>
          
          <div className="bg-white border rounded-lg">
            <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
              <h4 className="text-md font-semibold text-gray-900">FreeAgent Entries</h4>
              {processedData?.freeAgentEntries && (
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                  {processedData.freeAgentEntries.length} entries
                </span>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              <FreeAgentEntriesTab
                processedData={processedData}
                ebayAccountStatus={ebayAccountStatus}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};