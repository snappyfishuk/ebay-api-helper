// components/tabs/ImportTab.tsx
import React from 'react';
import {
  Connections,
  SetupStatus,
  EbayAccountStatus,
  DateRange,
  ProcessedTransactionData,
} from '../../types';

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
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Select Date Range
        </h3>

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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div className="flex flex-wrap gap-4 mt-6">
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
            <span>{isLoading ? "Fetching..." : "Fetch eBay Transactions"}</span>
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
      </div>

      {syncStatus && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
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
  );
};