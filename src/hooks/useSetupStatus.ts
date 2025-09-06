// hooks/useSetupStatus.ts
import { useMemo } from 'react';
import { Connections, EbayAccountStatus, SetupStatus } from '../types';

export const useSetupStatus = (
  connections: Connections,
  ebayAccountStatus: EbayAccountStatus
): SetupStatus => {
  return useMemo(() => ({
    ebayConnected: connections.ebay.isConnected,
    freeagentConnected: connections.freeagent.isConnected,
    ebayAccountReady: ebayAccountStatus.hasEbayAccount,
    readyToSync:
      connections.ebay.isConnected &&
      connections.freeagent.isConnected &&
      ebayAccountStatus.hasEbayAccount,
  }), [connections, ebayAccountStatus]);
};
