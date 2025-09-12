// hooks/useFreeAgentConnection.ts
import { useState, useCallback, useEffect } from 'react';
import { 
  FreeAgentConnection, 
  EbayAccountStatus, 
  FreeAgentBankAccount 
} from '../types';
import { FreeAgentApiService } from '../services/FreeAgentApiService';

interface TransferDestination {
  configured: boolean;
  accountUrl?: string;
  accountName?: string;
}

interface UseFreeAgentConnectionReturn {
  connection: FreeAgentConnection;
  ebayAccountStatus: EbayAccountStatus;
  availableEbayAccounts: FreeAgentBankAccount[];
  availableBankAccounts: FreeAgentBankAccount[]; // ✅ NEW: All bank accounts for transfer destination
  transferDestination: TransferDestination; // ✅ NEW: Transfer destination state
  isLoading: boolean;
  error: string | null;
  checkConnection: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  checkEbayAccountStatus: () => Promise<void>;
  createEbayAccount: (accountName?: string) => Promise<void>;
  selectExistingEbayAccount: (accountUrl: string) => Promise<void>;
  selectTransferDestination: (accountUrl: string, accountName: string) => Promise<void>; // ✅ NEW
  loadBankAccounts: () => Promise<void>; // ✅ NEW
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
  const [availableBankAccounts, setAvailableBankAccounts] = useState<FreeAgentBankAccount[]>([]); // ✅ NEW
  const [transferDestination, setTransferDestination] = useState<TransferDestination>({ // ✅ NEW
    configured: false,
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

  // ✅ NEW: Load all bank accounts for transfer destination selection
  const loadBankAccounts = useCallback(async () => {
    try {
      const response = await apiService.getBankAccounts();
      if (response.status === 'success' && response.data.bankAccounts) {
        setAvailableBankAccounts(response.data.bankAccounts);
        console.log("✅ Loaded bank accounts:", response.data.bankAccounts.length);
      }
    } catch (err) {
      console.error('Error loading bank accounts:', err);
      setError('Failed to load bank accounts');
    }
  }, []);

  // UPDATED: Now accepts accountName parameter and passes it to API
  const createEbayAccount = useCallback(async (accountName?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.createEbayAccount(accountName || "eBay UK seller Account");
      
      if (response.status === 'success') {
        console.log("✅ eBay account created successfully!");
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
        console.log("✅ Selected eBay account:", selectedAccount.name);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error selecting eBay account';
      console.error('Select eBay account error:', err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [availableEbayAccounts]);

  // ✅ NEW: Select transfer destination account
  const selectTransferDestination = useCallback(async (accountUrl: string, accountName: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Update transfer destination state
      setTransferDestination({
        configured: true,
        accountUrl,
        accountName,
      });
      
      console.log("✅ Selected transfer destination:", accountName);
      
      // TODO: You may want to save this to the backend/user settings
      // await apiService.saveTransferDestination(accountUrl, accountName);
      
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
      setAvailableBankAccounts([]); // ✅ NEW: Clear bank accounts
      setTransferDestination({ configured: false }); // ✅ NEW: Reset transfer destination
    } catch (err) {
      console.error('FreeAgent disconnect error:', err);
      setError('Error disconnecting from FreeAgent');
    }
  }, []);

  // Auto-load data when FreeAgent connects
  useEffect(() => {
    if (connection.isConnected) {
      checkEbayAccountStatus();
      loadBankAccounts(); // ✅ NEW: Load bank accounts when connected
    }
  }, [connection.isConnected, checkEbayAccountStatus, loadBankAccounts]);

  return {
    connection,
    ebayAccountStatus,
    availableEbayAccounts,
    availableBankAccounts, // ✅ NEW
    transferDestination, // ✅ NEW
    isLoading,
    error,
    checkConnection,
    connect,
    disconnect,
    checkEbayAccountStatus,
    createEbayAccount,
    selectExistingEbayAccount,
    selectTransferDestination, // ✅ NEW
    loadBankAccounts, // ✅ NEW
  };
};