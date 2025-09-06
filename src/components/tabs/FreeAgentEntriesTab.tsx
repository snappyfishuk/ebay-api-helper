// components/tabs/FreeAgentEntriesTab.tsx
import React from 'react';
import { ProcessedTransactionData, EbayAccountStatus } from '../../types';
import { formatUKDate } from '../../utils/formatters';

interface FreeAgentEntriesTabProps {
  processedData: ProcessedTransactionData | null;
  ebayAccountStatus: EbayAccountStatus;
}

export const FreeAgentEntriesTab: React.FC<FreeAgentEntriesTabProps> = ({
  processedData,
  ebayAccountStatus,
}) => {
  return (
    <div className="space-y-6">
      {processedData?.freeAgentEntries?.length ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Enhanced FreeAgent Entries ({processedData.freeAgentEntries.length})
            </h3>
            <div className="flex items-center space-x-2">
              <div className="bg-green-100 px-3 py-1 rounded-full text-sm font-medium text-green-800">
                Ready for Sync
              </div>
              {ebayAccountStatus.hasEbayAccount && (
                <div className="bg-blue-100 px-3 py-1 rounded-full text-sm font-medium text-blue-800">
                  → {ebayAccountStatus.bankAccount?.name || "eBay Sales"}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">
                {processedData.freeAgentEntries.length}
              </div>
              <div className="text-blue-800 text-sm">Total Transactions</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                {processedData.creditCount}
              </div>
              <div className="text-green-800 text-sm">Credits (Income)</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-600">
                {processedData.debitCount}
              </div>
              <div className="text-red-800 text-sm">Debits (Fees/Refunds)</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enhanced Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-gray-400 text-4xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Entries Generated
          </h3>
          <p className="text-gray-600">
            Fetch eBay transactions first to generate enhanced FreeAgent entries.
          </p>
        </div>
      )}
    </div>
  );
};