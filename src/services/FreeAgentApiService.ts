// services/FreeAgentApiService.ts - COMPLETE FIXED VERSION
import { 
  ApiResponse, 
  FreeAgentConnection, 
  EbayAccountStatus,
  FreeAgentBankAccount,
  SyncData 
} from '../types';
import { makeAuthenticatedRequest } from '../utils/apiUtils';

export class FreeAgentApiService {
  /**
   * Check eBay account status in FreeAgent
   * CRITICAL: Returns both account status and available accounts list
   */
  async checkEbayAccountStatus(): Promise<{
    data: EbayAccountStatus & { availableEbayAccounts?: FreeAgentBankAccount[] }
  }> {
    console.log("🔍 Checking eBay account status...");

    try {
      const data = await makeAuthenticatedRequest('/freeagent/ebay-account-status');
      
      console.log("📦 Raw API response:", data);
      console.log("📦 Response status:", data.status);
      console.log("📦 Response data type:", typeof data.data);

      if (data.data) {
        console.log("✅ Has data.data");
        console.log("📋 Has eBay Account:", data.data.hasEbayAccount);
        console.log("📋 Available eBay Accounts:", data.data.availableEbayAccounts);
        console.log("📋 Available eBay Accounts length:", data.data.availableEbayAccounts?.length);
      } else {
        console.log("❌ No data.data in response");
      }

      return data;
    } catch (error) {
      console.error("❌ checkEbayAccountStatus error:", error);
      throw error;
    }
  }

  /**
   * Check FreeAgent connection status
   */
  async checkConnectionStatus(): Promise<FreeAgentConnection> {
    try {
      console.log("🔍 Checking FreeAgent connection status...");
      const data = await makeAuthenticatedRequest('/freeagent/connection-status');
      
      console.log("📦 Connection status response:", data);
      
      return {
        isConnected: data.data?.isConnected || data.isConnected || false,
      };
    } catch (error) {
      console.error("❌ Error checking FreeAgent connection status:", error);
      return { isConnected: false };
    }
  }

  /**
   * Get all bank accounts from FreeAgent
   */
  async getBankAccounts(): Promise<ApiResponse<{ bankAccounts: FreeAgentBankAccount[] }>> {
    console.log("🏦 Fetching all bank accounts from FreeAgent...");
    
    try {
      const data = await makeAuthenticatedRequest('/freeagent/bank-accounts');
      
      console.log("📦 Bank accounts response:", data);
      
      if (data.status === 'success') {
        return data;
      } else {
        throw new Error(data.message || 'Failed to fetch bank accounts');
      }
    } catch (error: any) {
      console.error("❌ Failed to fetch bank accounts:", error);
      
      let errorMessage = "Failed to fetch bank accounts";
      
      if (error.message) {
        if (error.message.includes("unauthorized") || error.message.includes("401")) {
          errorMessage = "FreeAgent session expired. Please reconnect your FreeAgent account.";
        } else {
          errorMessage = error.message || "Unknown error fetching bank accounts";
        }
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Create new eBay account in FreeAgent
   */
  async createEbayAccount(accountName: string = "eBay UK seller Account"): Promise<ApiResponse<{
    created: boolean;
    account?: FreeAgentBankAccount;
  }>> {
    console.log("🏦 Creating new eBay account in FreeAgent...");

    try {
      const data = await makeAuthenticatedRequest('/freeagent/create-ebay-account', {
        method: 'POST',
        body: JSON.stringify({
          confirmCreate: "true",
          accountName: accountName
        })
      });

      console.log("📦 Create eBay account response:", data);
      return data;
    } catch (error) {
      console.error("❌ Create eBay account failed:", error);
      throw error;
    }
  }

  /**
   * Upload eBay transactions as a bank statement to FreeAgent
   */
  async uploadEbayStatement(syncData: { 
    transactions: { 
      dated_on: string; 
      amount: number; 
      description: string; 
      reference: string; 
    }[]; 
    bankAccountId: string; 
  }): Promise<ApiResponse<{ uploadedCount: number }>> {
    console.log("📤 Uploading eBay statement to FreeAgent...");
    console.log("Upload data:", {
      bankAccountId: syncData.bankAccountId,
      transactionCount: syncData.transactions?.length || 0,
    });

    try {
      const response = await makeAuthenticatedRequest('/freeagent/upload-ebay-statement', {
        method: 'POST',
        body: JSON.stringify(syncData)
      });

      console.log("✅ Statement upload response:", response);
      
      return {
        status: response.status || 'success',
        data: {
          uploadedCount: response.data?.uploadedCount || syncData.transactions.length
        }
      };
    } catch (error: any) {
      console.error("❌ Statement upload failed:", error);
      
      let errorMessage = "Statement upload failed";
      
      if (error.message) {
        if (error.message.includes("unauthorized") || error.message.includes("401")) {
          errorMessage = "FreeAgent session expired. Please reconnect your FreeAgent account.";
        } else if (error.message.includes("validation")) {
          errorMessage = "Invalid transaction data. Please check your transactions and try again.";
        } else {
          errorMessage = error.message || "Unknown upload error occurred";
        }
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Sync transactions to FreeAgent (older method - kept for compatibility)
   */
  async syncTransactions(syncData: SyncData): Promise<ApiResponse<any>> {
    console.log("🔄 Syncing transactions to FreeAgent...");
    console.log("Sync data:", {
      bankAccountId: syncData.bankAccountId,
      transactionCount: syncData.transactions?.length || 0,
    });

    try {
      const data = await makeAuthenticatedRequest('/freeagent/bank-transactions', {
        method: 'POST',
        body: JSON.stringify(syncData)
      });

      return data;
    } catch (error: any) {
      console.error("❌ Sync failed:", error);
      
      let errorMessage = "Sync failed";
      
      if (error.message) {
        if (error.message.includes("unauthorized") || error.message.includes("401")) {
          errorMessage = "FreeAgent session expired. Please reconnect your FreeAgent account.";
        } else if (error.message.includes("validation")) {
          errorMessage = "Invalid transaction data. Please check your transactions and try again.";
        } else {
          errorMessage = error.message || "Unknown sync error occurred";
        }
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Get FreeAgent OAuth URL
   */
  async getAuthUrl(): Promise<ApiResponse<{ authUrl: string }>> {
    try {
      const data = await makeAuthenticatedRequest('/freeagent/auth-url');

      if (data.status !== 'success') {
        throw new Error(data.message || "Failed to connect to FreeAgent");
      }

      return data;
    } catch (error) {
      console.error("❌ Get auth URL failed:", error);
      throw error;
    }
  }

  /**
   * Disconnect from FreeAgent
   */
  async disconnect(): Promise<void> {
    try {
      const data = await makeAuthenticatedRequest('/freeagent/disconnect', {
        method: 'DELETE'
      });

      if (data.status !== 'success') {
        throw new Error("Failed to disconnect from FreeAgent");
      }
    } catch (error) {
      console.error("❌ Disconnect failed:", error);
      throw error;
    }
  }
}