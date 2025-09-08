// services/FreeAgentApiService.ts
import { 
  ApiResponse, 
  FreeAgentConnection, 
  EbayAccountStatus,
  FreeAgentBankAccount,
  SyncData 
} from '../types';
import { getAuthHeaders } from '../utils/formatters';

export class FreeAgentApiService {
  private apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  /**
   * Check FreeAgent connection status
   */
  async checkConnectionStatus(): Promise<FreeAgentConnection> {
    try {
      const response = await fetch(
        `${this.apiUrl}/api/freeagent/connection-status`,
        {
          headers: getAuthHeaders(),
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          isConnected: data.data?.isConnected || data.isConnected || false,
        };
      }

      return { isConnected: false };
    } catch (error) {
      console.error("Error checking FreeAgent connection status:", error);
      return { isConnected: false };
    }
  }

  /**
   * Check eBay account status in FreeAgent
   * CRITICAL: Returns both account status and available accounts list
   */
  async checkEbayAccountStatus(): Promise<{
    data: EbayAccountStatus & { availableEbayAccounts?: FreeAgentBankAccount[] }
  }> {
    console.log("🔍 Checking eBay account status...");

    const response = await fetch(
      `${this.apiUrl}/api/freeagent/ebay-account-status`,
      {
        headers: getAuthHeaders(),
        credentials: "include",
      }
    );

    console.log("📡 Response status:", response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.log("❌ Response not OK:", response.status, errorData);
      throw new Error("Failed to check eBay account status");
    }

    const data = await response.json();
    console.log("📦 Full response data:", data);

    if (data.data) {
      console.log("✅ Has eBay Account:", data.data.hasEbayAccount);
      console.log("📋 Available eBay Accounts:", data.data.availableEbayAccounts);
    }

    return data;
  }

  /**
   * Create new eBay account in FreeAgent
   * IMPORTANT: Only creates if no existing eBay accounts found
   */
  async createEbayAccount(): Promise<ApiResponse<{
    created: boolean;
    bankAccount: FreeAgentBankAccount;
  }>> {
    const response = await fetch(
      `${this.apiUrl}/api/freeagent/create-ebay-account`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({
          confirmCreate: "true",
          accountName: "eBay UK seller Account",
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to set up eBay account");
    }

    return data;
  }

  /**
   * Select existing eBay account
   * CRITICAL: Used when multiple eBay accounts exist
   */
  async selectExistingEbayAccount(
    accountUrl: string
  ): Promise<ApiResponse<{ bankAccount: FreeAgentBankAccount }>> {
    const response = await fetch(
      `${this.apiUrl}/api/freeagent/select-ebay-account`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ accountUrl }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to select eBay account");
    }

    return data;
  }

  /**
   * Upload eBay transactions as bank statement
   * CRITICAL: Uses FreeAgent's statement import method for clean organization
   */
  async uploadEbayStatement(
    syncData: SyncData
  ): Promise<ApiResponse<{ uploadedCount: number }>> {
    console.log("Syncing with statement upload method:", syncData);

    const response = await fetch(
      `${this.apiUrl}/api/freeagent/upload-ebay-statement`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(syncData),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      let errorMessage = "Sync failed";

      if (data.status === "error") {
        if (data.message?.includes("authentication")) {
          errorMessage = "FreeAgent authentication failed. Please reconnect your FreeAgent account.";
        } else if (data.message?.includes("validation")) {
          errorMessage = "Invalid transaction data. Please check your transactions and try again.";
        } else {
          errorMessage = data.message || "Unknown sync error occurred";
        }
      }

      throw new Error(errorMessage);
    }

    return data;
  }

  /**
   * Get FreeAgent OAuth URL
   */
  async getAuthUrl(): Promise<ApiResponse<{ authUrl: string }>> {
    const response = await fetch(
      `${this.apiUrl}/api/freeagent/auth-url`,
      {
        headers: getAuthHeaders(),
        credentials: "include",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to connect to FreeAgent");
    }

    return data;
  }

  /**
   * Disconnect from FreeAgent
   */
  async disconnect(): Promise<void> {
    const response = await fetch(
      `${this.apiUrl}/api/freeagent/disconnect`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to disconnect from FreeAgent");
    }
  }
}
