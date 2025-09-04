// components/ProcessedDataView.js
import React from "react";

const ProcessedDataView = ({ processedData }) => {
  const formatUKDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Ready for Sync ({processedData.freeAgentEntries.length} entries)
      </h3>

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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Type
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {processedData.freeAgentEntries.slice(0, 10).map((entry, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatUKDate(entry.dated_on)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                  <div className="truncate" title={entry.description}>
                    {entry.description}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <span
                    className={
                      entry.amount < 0 ? "text-red-600" : "text-green-600"
                    }
                  >
                    £{Math.abs(entry.amount).toFixed(2)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      entry.amount < 0
                        ? "bg-red-100 text-red-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {entry.amount < 0 ? "Debit" : "Credit"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {processedData.freeAgentEntries.length > 10 && (
          <div className="p-4 text-center text-gray-500 text-sm">
            Showing first 10 of {processedData.freeAgentEntries.length}{" "}
            transactions
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessedDataView;
