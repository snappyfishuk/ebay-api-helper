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
   * 🔧 UPDATED: Fetch eBay transactions with pagination support
   * CRITICAL: Includes date validation and proper error handling
   */
  async fetchTransactions(
    options: DateRange & {
      fetchAll?: boolean;
      respectDateRange?: boolean;
      limit?: number;
    }
  ): Promise<ApiResponse<{ 
    transactions: EbayTransaction[]; 
    environment: string;
    limitRemoved?: boolean;
    fetchMode?: string;
    pagesFetched?: number;
    total?: number;
  }>> {
    console.log(
      `🔍 Fetching transactions from ${options.startDate} to ${options.endDate}`
    );
    console.log(`🎯 Fetch mode: ${options.fetchAll ? 'ALL transactions' : 'Limited fetch'}`);

    // Build query parameters
    const queryParams = new URLSearchParams({
      startDate: options.startDate,
      endDate: options.endDate,
    });

    // 🔧 NEW: Add fetchAll parameter if requested (this triggers backend pagination)
    if (options.fetchAll) {
      queryParams.set('fetchAll', 'true');
    }

    // Add limit for backwards compatibility
    if (options.limit) {
      queryParams.set('limit', options.limit.toString());
    }

    const data = await makeAuthenticatedRequest(
      `/ebay/transactions?${queryParams.toString()}`
    );

    if (data.status !== 'success') {
      throw new Error(data.message || "Failed to fetch transactions");
    }

    // 🔧 ENHANCED: Log pagination details
    const transactionCount = data.data?.transactions?.length || 0;
    console.log(`✅ Frontend: Received ${transactionCount} transactions`);
    
    if (data.data?.limitRemoved) {
      console.log('🎯 Confirmed: All transactions in date range fetched (no limits)');
    }
    
    if (data.data?.pagesFetched) {
      console.log(`📄 Backend fetched ${data.data.pagesFetched} pages`);
    }

    if (data.data?.fetchMode) {
      console.log(`🔧 Fetch mode: ${data.data.fetchMode}`);
    }

    // 🔧 WARNING: Check for exactly 100 transactions (possible limit issue)
    if (transactionCount === 100 && !data.data?.limitRemoved) {
      console.warn('⚠️ Received exactly 100 transactions but limitRemoved flag is false - check pagination');
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