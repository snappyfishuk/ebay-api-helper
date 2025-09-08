// services/EbayApiService.ts
import { 
  ApiResponse, 
  EbayTransaction, 
  EbayConnection,
  DateRange 
} from '../types';
import { makeAuthenticatedRequest } from '../utils/apiUtils';

export class EbayApiService {
  /**
   * Check eBay connection status
   * IMPORTANT: Returns both connection status and environment
   */
  async checkConnectionStatus(): Promise<EbayConnection> {
    try {
      const data = await makeAuthenticatedRequest('/ebay/connection-status');
      
      return {
        isConnected: data.data?.isConnected || data.isConnected || false,
        environment: data.data?.environment || data.environment || "production",
      };
    } catch (error) {
      console.error("Error checking eBay connection status:", error);
      return { isConnected: false, environment: "production" };
    }
  }

  /**
   * Get eBay OAuth URL for connection
   * CRITICAL: Always uses production environment as per requirements
   */
  async getAuthUrl(): Promise<ApiResponse<{ authUrl: string }>> {
    const data = await makeAuthenticatedRequest('/ebay/auth-url?environment=production');
    
    if (data.status !== 'success') {
      throw new Error(data.message || "Failed to connect to eBay");
    }
    
    return data;
  }

  /**
   * Fetch eBay transactions
   * CRITICAL: Includes date validation and proper error handling
   */
  async fetchTransactions(
    dateRange: DateRange
  ): Promise<ApiResponse<{ transactions: EbayTransaction[]; environment: string }>> {
    console.log(
      `Fetching transactions from ${dateRange.startDate} to ${dateRange.endDate}`
    );

    const data = await makeAuthenticatedRequest(
      `/ebay/transactions?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
    );

    if (data.status !== 'success') {
      throw new Error(data.message || "Failed to fetch transactions");
    }

    return data;
  }

  /**
   * Disconnect from eBay
   */
  async disconnect(): Promise<void> {
    const data = await makeAuthenticatedRequest('/ebay/disconnect', {
      method: 'DELETE'
    });

    if (data.status !== 'success') {
      throw new Error("Failed to disconnect from eBay");
    }
  }
}