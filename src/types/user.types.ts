// src/types/user.types.ts - Updated to match backend User model
export interface EbayConnectionInfo {
  isConnected: boolean;
  environment?: 'sandbox' | 'production';
  userId?: string;
  connectedAt?: Date;
  expiresAt?: Date;
}

export interface FreeAgentConnectionInfo {
  isConnected: boolean;
  companyId?: string;
  connectedAt?: Date;
  expiresAt?: Date;
}

export interface UserSettings {
  syncFrequency?: 'manual' | 'daily' | 'weekly';
  autoSync?: boolean;
  emailNotifications?: boolean;
  timezone?: string;
}

export interface SyncStats {
  totalTransactions?: number;
  totalSynced?: number;
  lastSyncCount?: number;
  errors?: number;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  
  // Account Status
  isEmailVerified?: boolean;
  subscriptionStatus?: 'trial' | 'active' | 'cancelled' | 'expired';
  trialEndsAt?: Date;
  
  // API Connections (as returned from API - no sensitive tokens)
  ebayConnection?: EbayConnectionInfo;
  freeagentConnection?: FreeAgentConnectionInfo;
  
  // Settings
  settings?: UserSettings;
  
  // Sync Statistics
  syncStats?: SyncStats;
  lastSyncAt?: Date;
  
  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
  
  // Virtual fields
  fullName?: string;
  isTrialActive?: boolean;
  hasActiveSubscription?: boolean;
}