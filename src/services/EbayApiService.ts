// services/EbayApiService.ts
import { 
  ApiResponse, 
  EbayTransaction, 
  EbayConnection,
  DateRange 
} from '../types';
import { getAuthHeaders } from '../utils/formatters';

export class EbayApiService {
  private apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  /**
   * Check eBay connection status
   * IMPORTANT: Returns both connection status and environment
   */
  async checkConnectionStatus(): Promise<EbayConnection> {
    try {
      const response = await fetch(
        `${this.apiUrl}/api/ebay/connection-status`,
        {
          headers: getAuthHeaders(),
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          isConnected: data.data?.isConnected || data.isConnected || false,
          environment: data.data?.environment || data.environment || "production",
        };
      }

      return { isConnected: false, environment: "production" };
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
    const response = await fetch(
      `${this.apiUrl}/api/ebay/auth-url?environment=production`,
      {
        headers: getAuthHeaders(),
        credentials: "include",
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
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

    const response = await fetch(
      `${this.apiUrl}/api/ebay/transactions?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
      {
        headers: getAuthHeaders(),
        credentials: "include",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch transactions");
    }

    return data;
  }

  /**
   * Disconnect from eBay
   */
  async disconnect(): Promise<void> {
    const response = await fetch(
      `${this.apiUrl}/api/ebay/disconnect`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to disconnect from eBay");
    }
  }
}
