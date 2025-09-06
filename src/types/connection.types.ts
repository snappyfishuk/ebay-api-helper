// Fix 1: Update connection.types.ts to import FreeAgentBankAccount
// types/connection.types.ts
import { FreeAgentBankAccount } from './freeagent.types';

export interface EbayConnection {
  isConnected: boolean;
  environment: 'production' | 'sandbox';
}

export interface FreeAgentConnection {
  isConnected: boolean;
}

export interface Connections {
  ebay: EbayConnection;
  freeagent: FreeAgentConnection;
}

export interface EbayAccountStatus {
  hasEbayAccount: boolean;
  autoCreated: boolean;
  needsSetup: boolean;
  bankAccount: FreeAgentBankAccount | null;
}

export interface SetupStatus {
  ebayConnected: boolean;
  freeagentConnected: boolean;
  ebayAccountReady: boolean;
  readyToSync: boolean;
}