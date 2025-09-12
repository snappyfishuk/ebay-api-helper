// hooks/useFreeAgentConnection.ts - FIXED VERSION
import { useState, useCallback, useEffect } from 'react';
import { 
  FreeAgentConnection, 
  EbayAccountStatus, 
  FreeAgentBankAccount 
} from '../types';
import { FreeAgentApiService } from '../services/FreeAgentApiService';

interface UseFreeAgentConnectionReturn {
  connection: FreeAgentConnection;
  ebayAccountStatus: EbayAccountStatus;
  availableEbayAccounts: FreeAgentBankAccount[];
  isLoading: boolean;
  error: string | null;
  checkConnection: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  checkEbayAccountStatus: () => Promise<void>;
  createEbayAccount: () => Promise<void>;
  selectExistingEbayAccount: (accountUrl: string) => Promise<void>;
}

export const useFreeAgentConnection = (): UseFreeAgentConnectionReturn => {
  const [connection, setConnection] = useState<FreeAgentConnection>({
    isConnected: false,
  });
  const [ebayAccountStatus, setEbayAccountStatus] = useState<EbayAccountStatus>({
    hasEbayAccount: false,
    autoCreated: false,
    needsSetup: true,
    bankAccount: null,
  });
  const [availableEbayAccounts, setAvailableEbayAccounts] = useState<FreeAgentBankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // No constructor parameters needed - service now uses apiUtils internally
  const apiService = new FreeAgentApiService();

  const checkConnection = useCallback(async () => {
    try {
      const status = await apiService.checkConnectionStatus();
      setConnection(status);
    } catch (err) {
      console.error('Error checking FreeAgent connection:', err);
      setError('Failed to check FreeAgent connection status');
    }
  }, []);

  // FIXED: Remove checkEbayAccountStatus from dependencies
  const checkEbayAccountStatus = useCallback(async () => {
    try {
      const response = await apiService.checkEbayAccountStatus();
      
      if (response.data) {
        setEbayAccountStatus({
          hasEbayAccount: response.data.hasEbayAccount,
          autoCreated: response.data.autoCreated,
          needsSetup: response.data.needsSetup,
          bankAccount: response.data.bankAccount,
        });

        // CRITICAL: Store available eBay accounts for selection
        if (response.data.availableEbayAccounts) {
          setAvailableEbayAccounts(response.data.availableEbayAccounts);
        }
      }
    } catch (err) {
      console.error('Error checking eBay account status:', err);
      setError('Failed to check eBay account status');
    }
  }, []); // FIXED: Empty dependency array

  const createEbayAccount = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.createEbayAccount();
      
      if (response.status === 'success') {
        // Refresh the eBay account status
        await checkEbayAccountStatus();
      } else {
        throw new Error(response.message || 'Failed to create eBay account');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error creating eBay account';
      console.error('Create eBay account error:', err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [checkEbayAccountStatus]);

  const selectExistingEbayAccount = useCallback(async (accountUrl: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Find the selected account from available accounts
      const selectedAccount = availableEbayAccounts.find(acc => acc.url === accountUrl);
      
      if (selectedAccount) {
        setEbayAccountStatus(prev => ({
          ...prev,
          hasEbayAccount: true,
          bankAccount: selectedAccount,
          needsSetup: false,
        }));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error selecting eBay account';
      console.error('Select eBay account error:', err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [availableEbayAccounts]);

  const connect = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.getAuthUrl();
      
      if (response.status === 'success' && response.data?.authUrl) {
        window.location.href = response.data.authUrl;
      } else {
        throw new Error('Failed to get auth URL');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error connecting to FreeAgent';
      console.error('FreeAgent connection error:', err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      setError(null);
      await apiService.disconnect();
      setConnection({ isConnected: false });
      setEbayAccountStatus({
        hasEbayAccount: false,
        autoCreated: false,
        needsSetup: true,
        bankAccount: null,
      });
      setAvailableEbayAccounts([]);
    } catch (err) {
      console.error('FreeAgent disconnect error:', err);
      setError('Error disconnecting from FreeAgent');
    }
  }, []);

  // FIXED: Auto-check eBay account status when FreeAgent connects
  // REMOVED checkEbayAccountStatus from dependencies to prevent infinite loop
  useEffect(() => {
    if (connection.isConnected) {
      checkEbayAccountStatus();
    }
  }, [connection.isConnected]); // FIXED: Only depend on connection.isConnected

  return {
    connection,
    ebayAccountStatus,
    availableEbayAccounts,
    isLoading,
    error,
    checkConnection,
    connect,
    disconnect,
    checkEbayAccountStatus,
    createEbayAccount,
    selectExistingEbayAccount,
  };
};