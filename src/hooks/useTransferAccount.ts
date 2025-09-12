// hooks/useTransferAccount.ts
import { useState, useEffect } from 'react';
import { makeAuthenticatedRequest } from '../utils/apiUtils';

interface TransferAccountData {
  mainBankAccount: string | null;
  mainBankAccountName: string | null;
  isConfigured: boolean;
  isReconciliationReady: boolean;
  autoTransferEnabled: boolean;
}

interface BankAccount {
  id: string;
  name: string;
  type: string;
  currency: string;
  currentBalance: number;
  apiUrl: string;
}

export const useTransferAccount = () => {
  const [transferAccountData, setTransferAccountData] = useState<TransferAccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load current transfer account configuration
  const loadTransferAccount = async () => {
    try {
      setLoading(true);
      const response = await makeAuthenticatedRequest('/freeagent/transfer-account', {
        method: 'GET'
      });
      
      if (response.status === 'success') {
        setTransferAccountData(response.data);
      }
    } catch (err) {
      console.error('Error loading transfer account:', err);
      setError('Failed to load transfer account configuration');
    } finally {
      setLoading(false);
    }
  };

  // Update transfer account
  const updateTransferAccount = async (mainBankAccount: string, mainBankAccountName: string) => {
    try {
      setSaving(true);
      setError(null);
      
      const response = await makeAuthenticatedRequest('/freeagent/transfer-account', {
        method: 'PUT',
        body: JSON.stringify({
          mainBankAccount,
          mainBankAccountName
        })
      });
      
      if (response.status === 'success') {
        setTransferAccountData(response.data);
        return { success: true, message: 'Transfer account configured successfully' };
      } else {
        throw new Error(response.message || 'Failed to update transfer account');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update transfer account';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setSaving(false);
    }
  };

  // Load available bank accounts for selection
  const loadBankAccounts = async (): Promise<BankAccount[]> => {
    try {
      const response = await makeAuthenticatedRequest('/freeagent/bank-accounts', {
        method: 'GET'
      });
      
      if (response.status === 'success' && response.data?.bankAccounts) {
        return response.data.bankAccounts;
      }
      return [];
    } catch (err) {
      console.error('Error loading bank accounts:', err);
      throw new Error('Failed to load bank accounts');
    }
  };

  // Load data on mount
  useEffect(() => {
    loadTransferAccount();
  }, []);

  return {
    transferAccountData,
    loading,
    saving,
    error,
    loadTransferAccount,
    updateTransferAccount,
    loadBankAccounts,
    clearError: () => setError(null)
  };
};