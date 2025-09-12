// hooks/useFreeAgentConnection.ts - FIXED URL PROPERTY ISSUE
import { useState, useCallback, useEffect } from 'react';
import { 
  FreeAgentConnection, 
  EbayAccountStatus, 
  FreeAgentBankAccount 
} from '../types';
import { FreeAgentApiService } from '../services/FreeAgentApiService';
import { makeAuthenticatedRequest } from '../utils/apiUtils';

interface TransferDestination {
  configured: boolean;
  accountUrl: string;
  accountName: string;
}

interface UseFreeAgentConnectionReturn {
  connection: FreeAgentConnection;
  ebayAccountStatus: EbayAccountStatus;
  availableEbayAccounts: FreeAgentBankAccount[];
  availableBankAccounts: FreeAgentBankAccount[];
  transferDestination: TransferDestination;
  isLoading: boolean;
  error: string | null;
  checkConnection: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  checkEbayAccountStatus: () => Promise<void>;
  createEbayAccount: () => Promise<void>;
  selectExistingEbayAccount: (accountUrl: string) => Promise<void>;
  selectTransferDestination: (accountUrl: string, accountName: string) => Promise<void>;
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
  const [availableBankAccounts, setAvailableBankAccounts] = useState<FreeAgentBankAccount[]>([]);
  const [transferDestination, setTransferDestination] = useState<TransferDestination>({
    configured: false,
    accountUrl: '',
    accountName: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const loadBankAccounts = useCallback(async () => {
    try {
      const response = await apiService.getBankAccounts();
      if (response.status === 'success' && response.data?.bankAccounts) {
        setAvailableBankAccounts(response.data.bankAccounts);
      }
    } catch (err) {
      console.error('Error loading bank accounts:', err);
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

        // CRITICAL: Store available eBay accounts for selection
        if (response.data.availableEbayAccounts) {
          setAvailableEbayAccounts(response.data.availableEbayAccounts);
        }
      }
    } catch (err) {
      console.error('Error checking eBay account status:', err);
      setError('Failed to check eBay account status');
    }
  }, []);

  const createEbayAccount = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.createEbayAccount();
      
      if (response.status === 'success') {
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

  // FIXED: Use the correct URL property from the account data
  const selectExistingEbayAccount = useCallback(async (accountUrl: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 Selecting eBay account with URL:', accountUrl);
      
      // Call the backend API to save the selection
      const response = await makeAuthenticatedRequest('/freeagent/select-ebay-account', {
        method: 'POST',
        body: JSON.stringify({ accountUrl })
      });

      if (response.status === 'success') {
        console.log('✅ eBay account selection saved to backend');
        
        // FIXED: Find account using the correct property (id or apiUrl)
        const selectedAccount = availableEbayAccounts.find(acc => 
          acc.id === accountUrl || acc.apiUrl === accountUrl
        );
        
        if (selectedAccount) {
          setEbayAccountStatus(prev => ({
            ...prev,
            hasEbayAccount: true,
            bankAccount: selectedAccount,
            needsSetup: false,
          }));
        }
      } else {
        throw new Error(response.message || 'Failed to save eBay account selection');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error selecting eBay account';
      console.error('Select eBay account error:', err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [availableEbayAccounts]);

  const selectTransferDestination = useCallback(async (accountUrl: string, accountName: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 Selecting transfer destination:', accountName);
      
      try {
        const response = await makeAuthenticatedRequest('/freeagent/transfer-destination', {
          method: 'POST',
          body: JSON.stringify({ 
            mainBankAccount: accountUrl,
            mainBankAccountName: accountName 
          })
        });

        if (response.status === 'success') {
          console.log('✅ Transfer destination saved to backend');
        }
      } catch (backendError) {
        console.warn('⚠️ Backend save failed, but updating local state:', backendError);
      }
      
      setTransferDestination({
        configured: true,
        accountUrl: accountUrl,
        accountName: accountName,
      });
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error selecting transfer destination';
      console.error('Select transfer destination error:', err);
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
      setAvailableBankAccounts([]);
      setTransferDestination({
        configured: false,
        accountUrl: '',
        accountName: '',
      });
    } catch (err) {
      console.error('FreeAgent disconnect error:', err);
      setError('Error disconnecting from FreeAgent');
    }
  }, []);

  useEffect(() => {
    if (connection.isConnected) {
      checkEbayAccountStatus();
      loadBankAccounts();
    }
  }, [connection.isConnected]);

  return {
    connection,
    ebayAccountStatus,
    availableEbayAccounts,
    availableBankAccounts,
    transferDestination,
    isLoading,
    error,
    checkConnection,
    connect,
    disconnect,
    checkEbayAccountStatus,
    createEbayAccount,
    selectExistingEbayAccount,
    selectTransferDestination,
  };
};