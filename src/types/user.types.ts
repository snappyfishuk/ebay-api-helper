// src/types/user.types.ts - Complete User Types with Auto-Sync Support
export interface EbayConnectionInfo {
  isConnected: boolean;
  environment?: 'sandbox' | 'production';
  userId?: string;
  username?: string; // Real eBay username from Commerce Identity API
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

export interface SyncHistoryEntry {
  timestamp: Date;
  transactionsProcessed: number;
  transactionsCreated: number;
  transactionsFailed: number;
  duration: number;
  environment: string;
  bankAccount: string;
  errors: string[];
  syncType: 'manual' | 'auto';
}

export interface AutoSyncStats {
  totalAutoSyncs?: number;
  successfulAutoSyncs?: number;
  failedAutoSyncs?: number;
  averageTransactionsPerSync?: number;
  lastSuccessfulSync?: Date;
  lastFailureSync?: Date;
}

export interface AutoSyncError {
  date: Date;
  error: string;
  resolved: boolean;
}

export interface AutoSyncNotifications {
  email?: boolean;
  syncSuccess?: boolean;
  syncFailure?: boolean;
}

export interface AutoSyncSettings {
  enabled?: boolean;
  lagDays?: number;
  lastAutoSync?: Date;
  nextScheduledSync?: Date;
  retryCount?: number;
  maxRetries?: number;
  syncErrors?: AutoSyncError[];
  notifications?: AutoSyncNotifications;
  stats?: AutoSyncStats;
}

export interface SyncStats {
  totalTransactions?: number;
  totalSynced?: number;
  lastSyncCount?: number;
  errors?: number;
  lastSyncDuration?: number;
  averageSyncTime?: number;
  syncHistory?: SyncHistoryEntry[];
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
  
  // Auto-Sync Configuration
  autoSync?: AutoSyncSettings;
  
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