// hooks/useTransactions.ts
import { useState, useCallback, useMemo } from 'react';
import {
  EbayTransaction,
  ProcessedTransactionData,
  DateRange,
  EbayAccountStatus,
} from '../types';
import { EbayApiService } from '../services/EbayApiService';
import { FreeAgentApiService } from '../services/FreeAgentApiService';
import { TransactionService } from '../services/TransactionService';
import { ValidationService } from '../services/ValidationService';
import { makeAuthenticatedRequest } from '../utils/apiUtils';

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

  // Use useMemo to create stable service instances
  const services = useMemo(() => ({
    ebayService: new EbayApiService(),
    freeagentService: new FreeAgentApiService(),
    transactionService: new TransactionService(),
    validationService: new ValidationService(),
  }), []);

  const fetchTransactions = useCallback(async () => {
    if (!isEbayConnected) {
      setError("Please connect to eBay first");
      return;
    }

    // Validate date range
    const validation = services.validationService.validateDateRange(
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
      console.log(`🚀 Fetching ALL transactions from ${selectedDateRange.startDate} to ${selectedDateRange.endDate} - NO LIMITS`);
      
      // UPDATED: Direct API call with fetchAll=true to bypass any service limitations
      const response = await makeAuthenticatedRequest(
        `/ebay/transactions?startDate=${selectedDateRange.startDate}&endDate=${selectedDateRange.endDate}&fetchAll=true`,
        {
          method: 'GET',
        }
      );

      if (response.status === 'success') {
        const txns = response.data.transactions || [];
        setTransactions(txns);
        
        // Enhanced success logging
        console.log(`✅ Success: Fetched ${txns.length} transactions`);
        console.log(`📊 Fetch mode: ${response.data.fetchMode || 'unknown'}`);
        console.log(`🔓 Limits removed: ${response.data.limitRemoved || false}`);
        console.log(`📄 Pages fetched: ${response.data.pagesFetched || 1}`);
        
        if (response.data.fetchMode === 'ALL_TRANSACTIONS') {
          console.log('🎉 SUCCESS: Using unlimited transaction fetching!');
        }
        
        // Process transactions for FreeAgent using the service
        const processed = services.transactionService.processTransactionsForFreeAgent(txns);
        setProcessedData(processed);
        
        // Calculate date span for user feedback
        const startDate = new Date(selectedDateRange.startDate);
        const endDate = new Date(selectedDateRange.endDate);
        const daySpan = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        // Enhanced status message with unlimited info
        const statusMessage = response.data.limitRemoved 
          ? `✅ Fetched ALL ${txns.length} transactions across ${daySpan} days`
          : `Fetched ${txns.length} transactions from ${daySpan} days of eBay data`;
        
        setSyncStatus(statusMessage);

        console.log(`📈 Processed summary:`, {
          totalTransactions: txns.length,
          freeAgentEntries: processed.freeAgentEntries.length,
          credits: processed.creditCount,
          debits: processed.debitCount,
          totalAmount: processed.totalAmount,
          netAmount: processed.netAmount,
          dateSpan: daySpan,
          unlimited: response.data.limitRemoved || false,
        });
      } else {
        throw new Error(response.message || 'Failed to fetch transactions');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch transactions';
      console.error('❌ Transaction fetch error:', err);
      setError(message);
      setSyncStatus(null);
    } finally {
      setIsLoading(false);
    }
  }, [isEbayConnected, selectedDateRange, services]);

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

      console.log(`🔄 Syncing ${syncData.transactions.length} transactions to FreeAgent...`);
      const response = await services.freeagentService.uploadEbayStatement(syncData);
      
      const uploadedCount = response?.data?.uploadedCount || processedData.freeAgentEntries.length;
      console.log(`✅ Successfully synced ${uploadedCount} transactions to FreeAgent`);

      setSyncStatus(
        `Statement upload successful! ${uploadedCount} transactions uploaded to ${
          ebayAccountStatus.bankAccount.name || 'eBay Sales account'
        } using FreeAgent's statement import method.`
      );

      setProcessedData(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      console.error('❌ Statement upload error:', err);
      setError(message);
      setSyncStatus(null);
    } finally {
      setIsLoading(false);
    }
  }, [processedData, services]);

  const exportToCsv = useCallback(() => {
    if (processedData) {
      console.log(`📁 Exporting ${processedData.freeAgentEntries.length} transactions to CSV...`);
      services.transactionService.exportToCsv(processedData);
    }
  }, [processedData, services]);

  const setDatePreset = useCallback((days: number) => {
    console.log(`📅 Setting date preset: ${days} days back`);
    const newRange = services.validationService.createDatePreset(days);
    setSelectedDateRange(newRange);
    setError(null);
    
    // Clear existing data when changing date range
    setTransactions([]);
    setProcessedData(null);
    setSyncStatus(null);
  }, [services]);

  const handleStartDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    const validation = services.validationService.validateDateRange(
      newStartDate,
      selectedDateRange.endDate
    );

    if (!validation.isValid) {
      setError(validation.error || '');
      return;
    }

    setError(null);
    setSelectedDateRange(prev => ({ ...prev, startDate: newStartDate }));
    
    // Clear existing data when changing date range
    setTransactions([]);
    setProcessedData(null);
    setSyncStatus(null);
  }, [selectedDateRange.endDate, services]);

  const handleEndDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    const validation = services.validationService.validateDateRange(
      selectedDateRange.startDate,
      newEndDate
    );

    if (!validation.isValid) {
      setError(validation.error || '');
      return;
    }

    setError(null);
    setSelectedDateRange(prev => ({ ...prev, endDate: newEndDate }));
    
    // Clear existing data when changing date range
    setTransactions([]);
    setProcessedData(null);
    setSyncStatus(null);
  }, [selectedDateRange.startDate, services]);

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