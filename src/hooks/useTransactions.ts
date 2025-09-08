// hooks/useTransactions.ts
import { useState, useCallback } from 'react';
import {
  EbayTransaction,
  ProcessedTransactionData,
  DateRange,
  EbayAccountStatus,
} from '../types';
import { EbayApiService } from '../services/EbayApiService';
import { FreeAgentApiService } from '../services/FreeAgentApiService';
import { TransactionService, ValidationService } from '../services';

interface UseTransactionsReturn {
  transactions: EbayTransaction[];
  processedData: ProcessedTransactionData | null;
  syncStatus: string | null;
  isLoading: boolean;
  error: string | null;
  selectedDateRange: DateRange;
  fetchTransactions: () => Promise<void>;
  syncToFreeAgent: (ebayAccountStatus: EbayAccountStatus) => Promise<void>;
  exportToCsv: () => void;
  setDatePreset: (days: number) => void;
  handleStartDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleEndDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const useTransactions = (isEbayConnected: boolean): UseTransactionsReturn => {
  const [transactions, setTransactions] = useState<EbayTransaction[]>([]);
  const [processedData, setProcessedData] = useState<ProcessedTransactionData | null>(null);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize with 30-day range
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    return {
      startDate: thirtyDaysAgo.toISOString().split("T")[0],
      endDate: today.toISOString().split("T")[0],
    };
  });

  // No constructor parameters needed - services now use apiUtils internally
  const ebayService = new EbayApiService();
  const freeagentService = new FreeAgentApiService();
  const transactionService = new TransactionService();
  const validationService = new ValidationService();

  const fetchTransactions = useCallback(async () => {
    if (!isEbayConnected) {
      setError("Please connect to eBay first");
      return;
    }

    // Fix: Pass individual startDate and endDate parameters
    const validation = validationService.validateDateRange(
      selectedDateRange.startDate, 
      selectedDateRange.endDate
    );
    if (!validation.isValid) {
      setError(validation.error || "Invalid date range");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSyncStatus("Fetching transactions from eBay...");

    try {
      const response = await ebayService.fetchTransactions(selectedDateRange);
      
      if (response.status === 'success' && response.data?.transactions) {
        setTransactions(response.data.transactions);
        
        // Fix: Use the actual method from useTransactionProcessing
        const { processTransactionsForFreeAgent } = require('../hooks/useTransactionProcessing')();
        const processed = processTransactionsForFreeAgent(response.data.transactions);
        setProcessedData(processed);
        
        setSyncStatus(`Found ${response.data.transactions.length} transactions`);
      } else {
        throw new Error(response.message || 'Failed to fetch transactions');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error fetching transactions';
      console.error('Transaction fetch error:', err);
      setError(message);
      setSyncStatus(null);
    } finally {
      setIsLoading(false);
    }
  }, [isEbayConnected, selectedDateRange, ebayService, validationService]);

  const syncToFreeAgent = useCallback(async (ebayAccountStatus: EbayAccountStatus) => {
    if (!processedData || !ebayAccountStatus.bankAccount) {
      setError("No transaction data or bank account available");
      return;
    }

    setIsLoading(true);
    setSyncStatus("Syncing transactions to FreeAgent...");

    try {
      const syncData = {
        transactions: processedData.freeAgentEntries,
        bankAccountId: ebayAccountStatus.bankAccount.url,
      };

      const response = await freeagentService.syncTransactions(syncData);
      
      if (response.status === 'success') {
        setSyncStatus(`Successfully synced ${processedData.freeAgentEntries.length} transactions`);
      } else {
        throw new Error(response.message || 'Sync failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error syncing transactions';
      console.error('Sync error:', err);
      setError(message);
      setSyncStatus(null);
    } finally {
      setIsLoading(false);
    }
  }, [processedData, freeagentService]);

  const exportToCsv = useCallback(() => {
    if (!processedData) {
      setError("No transaction data available");
      return;
    }

    // Fix: The method is likely in useTransactionProcessing hook
    // For now, create a simple CSV export
    const csvContent = processedData.freeAgentEntries.map(entry => 
      [entry.dated_on, entry.amount, entry.description, entry.reference].join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ebay-transactions-${selectedDateRange.startDate}-to-${selectedDateRange.endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, [processedData, selectedDateRange]);

  const setDatePreset = useCallback((days: number) => {
    const newRange = validationService.createDatePreset(days);
    setSelectedDateRange(newRange);
    setError(null);
  }, [validationService]);

  const handleStartDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    const validation = validationService.validateDateRange(
      newStartDate,
      selectedDateRange.endDate
    );

    if (!validation.isValid) {
      setError(validation.error || '');
      return;
    }

    setError(null);
    setSelectedDateRange(prev => ({ ...prev, startDate: newStartDate }));
  }, [selectedDateRange.endDate, validationService]);

  const handleEndDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    const validation = validationService.validateDateRange(
      selectedDateRange.startDate,
      newEndDate
    );

    if (!validation.isValid) {
      setError(validation.error || '');
      return;
    }

    setError(null);
    setSelectedDateRange(prev => ({ ...prev, endDate: newEndDate }));
  }, [selectedDateRange.startDate, validationService]);

  return {
    transactions,
    processedData,
    syncStatus,
    isLoading,
    error,
    selectedDateRange,
    fetchTransactions,
    syncToFreeAgent,
    exportToCsv,
    setDatePreset,
    handleStartDateChange,
    handleEndDateChange,
  };
};