// components/TransactionTable.js
import React from "react";

const TransactionTable = ({ transactions }) => {
  const formatUKDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTransactionType = (transactionType) => {
    const typeMap = {
      SALE: "Sale",
      REFUND: "Refund",
      WITHDRAWAL: "Payout/Withdrawal",
      NON_SALE_CHARGE: "Fee/Charge",
      DISPUTE: "Dispute",
      TRANSFER: "Transfer",
      ADJUSTMENT: "Adjustment",
      CREDIT: "Credit",
      DEBIT: "Debit",
    };
    return typeMap[transactionType] || transactionType;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        eBay Transactions ({transactions.length})
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((txn, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatUKDate(txn.transactionDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    {formatTransactionType(txn.transactionType)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <span
                    className={
                      parseFloat(txn.amount?.value || 0) < 0
                        ? "text-red-600"
                        : "text-green-600"
                    }
                  >
                    {txn.amount?.currencyCode}{" "}
                    {Math.abs(txn.amount?.value || 0)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div
                    className="max-w-xs truncate"
                    title={txn.transactionMemo || `eBay ${txn.transactionType}`}
                  >
                    {txn.transactionMemo || `eBay ${txn.transactionType}`}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionTable;
