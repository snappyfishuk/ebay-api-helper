// hooks/useEbayConnection.ts
import { useState, useCallback } from 'react';
import { EbayConnection, ApiResponse } from '../types';
import { EbayApiService } from '../services/EbayApiService';

interface UseEbayConnectionReturn {
  connection: EbayConnection;
  isLoading: boolean;
  error: string | null;
  checkConnection: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export const useEbayConnection = (): UseEbayConnectionReturn => {
  const [connection, setConnection] = useState<EbayConnection>({
    isConnected: false,
    environment: 'production',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiService = new EbayApiService(process.env.REACT_APP_API_URL || '');

  const checkConnection = useCallback(async () => {
    try {
      const status = await apiService.checkConnectionStatus();
      setConnection(status);
    } catch (err) {
      console.error('Error checking eBay connection:', err);
      setError('Failed to check eBay connection status');
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
      const message = err instanceof Error ? err.message : 'Error connecting to eBay';
      console.error('eBay connection error:', err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      setError(null);
      await apiService.disconnect();
      setConnection({ isConnected: false, environment: 'production' });
    } catch (err) {
      console.error('eBay disconnect error:', err);
      setError('Error disconnecting from eBay');
    }
  }, []);

  return {
    connection,
    isLoading,
    error,
    checkConnection,
    connect,
    disconnect,
  };
};