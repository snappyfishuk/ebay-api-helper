// hooks/useFreeAgentConnection.ts
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

  const apiService = new FreeAgentApiService(process.env.REACT_APP_API_URL || '');

  const checkConnection = useCallback(async () => {
    try {
      const status = await apiService.checkConnectionStatus();
      setConnection(status);
    } catch (err) {
      console.error('Error checking FreeAgent connection:', err);
      setError('Failed to check FreeAgent connection status');
    }
  }, []);

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

        // CRITICAL: Store available accounts for potential selection
        if (response.data.availableEbayAccounts && response.data.availableEbayAccounts.length > 0) {
          console.log('💾 Setting available accounts:', response.data.availableEbayAccounts.length);
          setAvailableEbayAccounts(response.data.availableEbayAccounts);
        } else {
          console.log('⚠️ No available eBay accounts found in response');
        }
      }
    } catch (err) {
      console.error('💥 Error checking eBay account status:', err);
    }
  }, []);

  const createEbayAccount = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiService.createEbayAccount();
      
      if (response.data) {
        setEbayAccountStatus({
          hasEbayAccount: true,
          autoCreated: response.data.created,
          needsSetup: false,
          bankAccount: response.data.bankAccount,
        });
        // Clear available accounts since we now have a selected one
        setAvailableEbayAccounts([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to set up eBay account';
      console.error('Error setting up eBay account:', err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectExistingEbayAccount = useCallback(async (accountUrl: string) => {
    try {
      setIsLoading(true);
      const response = await apiService.selectExistingEbayAccount(accountUrl);
      
      if (response.data) {
        setEbayAccountStatus({
          hasEbayAccount: true,
          autoCreated: false,
          needsSetup: false,
          bankAccount: response.data.bankAccount,
        });
        // Clear available accounts since we now have a selected one
        setAvailableEbayAccounts([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to select eBay account';
      console.error('Error selecting eBay account:', err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  // Auto-check eBay account status when FreeAgent connects
  useEffect(() => {
    if (connection.isConnected) {
      checkEbayAccountStatus();
    }
  }, [connection.isConnected, checkEbayAccountStatus]);

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