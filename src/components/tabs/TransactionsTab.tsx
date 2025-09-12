// components/tabs/TransactionsTab.tsx
import React from 'react';
import { EbayTransaction } from '../../types';
import { formatUKDate } from '../../utils/formatters';
import { TransactionService } from '../../services/TransactionService';

interface TransactionsTabProps {
  transactions: EbayTransaction[];
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({ transactions }) => {
  const transactionService = new TransactionService();

  // Helper function to format transaction type
  const formatTransactionType = (type: string): string => {
    const typeMap: Record<string, string> = {
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
    return typeMap[type] || type;
  };

  // Helper function to determine if transaction is debit
  const determineIfDebit = (txn: EbayTransaction): boolean => {
    const amount = parseFloat(txn.amount?.value?.toString() || '0');
    const debitTypes = ['WITHDRAWAL', 'NON_SALE_CHARGE', 'REFUND'];
    return txn.bookingEntry === "DEBIT" || 
           debitTypes.includes(txn.transactionType) || 
           amount < 0;
  };

  return (
    <div className="space-y-6">
      {transactions.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              eBay Transactions ({transactions.length})
            </h3>
            <div className="bg-blue-100 px-3 py-1 rounded-full text-sm font-medium text-blue-800">
              Enhanced Descriptions
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
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enhanced Description
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((txn, index) => {
                  const isDebit = determineIfDebit(txn);
                  const description = transactionService.generateDisplayDescription(txn);
                  
                  return (
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
                        <span className={isDebit ? "text-red-600" : "text-green-600"}>
                          {txn.amount?.currencyCode}{" "}
                          {Math.abs(parseFloat(txn.amount?.value?.toString() || '0'))}
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
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-gray-400 text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Transactions Found
          </h3>
          <p className="text-gray-600">
            Connect to eBay and fetch transactions to see enhanced descriptions here.
          </p>
        </div>
      )}
    </div>
  );
};