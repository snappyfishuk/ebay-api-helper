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

  // Simple service instances - TEMPORARY FIX for build issue
  const ebayService = new EbayApiService();
  const freeagentService = new FreeAgentApiService();
  const transactionService = new TransactionService();
  const validationService = new ValidationService();

  const fetchTransactions = useCallback(async () => {
    if (!isEbayConnected) {
      setError("Please connect to eBay first");
      return;
    }

    // FIX: This was the truncated line causing the error
    const validation = validationService.validateDateRange(
      selectedDateRange.startDate,
      selectedDateRange.endDate
    );
    
    if (!validation.isValid) {
      setError(validation.error || '');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await ebayService.fetchTransactions(selectedDateRange);
      
      if (response.data) {
        const txns = response.data.transactions || [];
        setTransactions(txns);
        
        // Process transactions for FreeAgent
        const processed = transactionService.processTransactionsForFreeAgent(txns);
        setProcessedData(processed);
        
        setSyncStatus(
          `Fetched ${txns.length} transactions from eBay ${response.data.environment || 'production'}`
        );

        console.log(`Processed data:`, {
          total: processed.freeAgentEntries.length,
          credits: processed.creditCount,
          debits: processed.debitCount,
          totalAmount: processed.totalAmount,
          netAmount: processed.netAmount,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch transactions';
      console.error('Transaction fetch error:', err);
      setError(message);
      setSyncStatus(null);
    } finally {
      setIsLoading(false);
    }
  }, [isEbayConnected, selectedDateRange, validationService, ebayService, transactionService]);

  const syncToFreeAgent = useCallback(async (ebayAccountStatus: EbayAccountStatus) => {
    if (!processedData) {
      setError("Please fetch transactions first");
      return;
    }

    if (!ebayAccountStatus.hasEbayAccount) {
      setError("Please set up your eBay account first");
      return;
    }

    if (!ebayAccountStatus.bankAccount) {
      setError("No bank account configured");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const bankAccountId = ebayAccountStatus.bankAccount.url.split("/").pop();
      
      if (!bankAccountId) {
        throw new Error("Invalid bank account ID");
      }

      const syncData = {
        transactions: processedData.freeAgentEntries.map((entry) => ({
          dated_on: entry.dated_on,
          amount: entry.amount,
          description: entry.description,
          reference: entry.reference,
        })),
        bankAccountId: bankAccountId,
      };

      const response = await freeagentService.uploadEbayStatement(syncData);
      
      const uploadedCount = response.data?.uploadedCount || processedData.freeAgentEntries.length;

      setSyncStatus(
        `Statement upload successful! ${uploadedCount} transactions uploaded to ${
          ebayAccountStatus.bankAccount.name || 'eBay Sales account'
        } using FreeAgent's statement import method.`
      );

      setProcessedData(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      console.error('Statement upload error:', err);
      setError(message);
      setSyncStatus(null);
    } finally {
      setIsLoading(false);
    }
  }, [processedData, freeagentService]);

  const exportToCsv = useCallback(() => {
    if (processedData) {
      transactionService.exportToCsv(processedData);
    }
  }, [processedData, transactionService]);

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