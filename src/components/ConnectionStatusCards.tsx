// components/ConnectionStatusCards.tsx
import React from 'react';

interface ConnectionStatusCardsProps {
  user: any;
  connections: any;
  freeagentConnection: any;
  ebayConnection: any;
}

export const ConnectionStatusCards: React.FC<ConnectionStatusCardsProps> = ({
  user,
  connections,
  freeagentConnection,
  ebayConnection
}) => {
  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Connection Status</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* eBay Status Card */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-4">
          <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${(user?.ebayConnection?.isConnected || connections.ebay.isConnected) ? 'bg-green-600' : 'bg-gray-300'}`}></div>
          <div className="text-sm font-bold text-blue-900 mb-1">eBay Username</div>
          <div className="text-xs text-blue-800 truncate font-medium mb-3" title={
            (user?.ebayConnection?.isConnected || connections.ebay.isConnected) 
              ? (user?.ebayConnection?.username || `Connected (${user?.ebayConnection?.environment || 'production'})`)
              : 'Not connected'
          }>
            {(user?.ebayConnection?.isConnected || connections.ebay.isConnected) 
              ? (user?.ebayConnection?.username || 'Connected')
              : 'Not connected'}
          </div>
          
          {(user?.ebayConnection?.isConnected || connections.ebay.isConnected) ? (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-green-600 font-medium flex-1">Connected</span>
              <button
                onClick={ebayConnection.disconnect}
                disabled={ebayConnection.isLoading}
                className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {ebayConnection.isLoading ? 'Disconnecting...' : 'Disconnect'}
              </button>
            </div>
          ) : (
            <button
              onClick={ebayConnection.connect}
              disabled={ebayConnection.isLoading}
              className="w-full px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {ebayConnection.isLoading ? 'Connecting...' : 'Connect eBay'}
            </button>
          )}
        </div>

        {/* FreeAgent Status Card */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-lg p-4">
          <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${(user?.freeagentConnection?.isConnected || connections.freeagent.isConnected) ? 'bg-green-600' : 'bg-gray-300'}`}></div>
          <div className="text-sm font-bold text-green-900 mb-1">FreeAgent User Email</div>
          <div className="text-xs text-green-800 truncate font-medium mb-3" title={
            (user?.freeagentConnection?.isConnected || connections.freeagent.isConnected) 
              ? (user?.email || 'Connected')
              : 'Not connected'
          }>
            {(user?.freeagentConnection?.isConnected || connections.freeagent.isConnected) 
              ? (user?.email || 'Connected')
              : 'Not connected'}
          </div>
          
          {(user?.freeagentConnection?.isConnected || connections.freeagent.isConnected) ? (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-green-600 font-medium flex-1">Connected</span>
              <button
                onClick={freeagentConnection.disconnect}
                disabled={freeagentConnection.isLoading}
                className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {freeagentConnection.isLoading ? 'Disconnecting...' : 'Disconnect'}
              </button>
            </div>
          ) : (
            <button
              onClick={freeagentConnection.connect}
              disabled={freeagentConnection.isLoading}
              className="w-full px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {freeagentConnection.isLoading ? 'Connecting...' : 'Connect FreeAgent'}
            </button>
          )}
        </div>

        {/* Bank Account Status */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-300 rounded-lg p-4 text-center">
          <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${freeagentConnection.ebayAccountStatus.hasEbayAccount ? 'bg-green-600' : 'bg-gray-300'}`}></div>
          <div className="text-sm font-bold text-green-900 mb-1">FreeAgent Bank Account</div>
          <div className="text-xs text-green-800 truncate font-medium" title={
            freeagentConnection.ebayAccountStatus.hasEbayAccount 
              ? (freeagentConnection.ebayAccountStatus.bankAccount?.name || 'eBay Sales Account')
              : 'Setup needed'
          }>
            {freeagentConnection.ebayAccountStatus.hasEbayAccount 
              ? (freeagentConnection.ebayAccountStatus.bankAccount?.name || 'eBay Sales Account')
              : 'Setup needed'}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 rounded-lg p-4 text-center">
          <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${
            (user?.ebayConnection?.isConnected || connections.ebay.isConnected) && 
            (user?.freeagentConnection?.isConnected || connections.freeagent.isConnected) && 
            freeagentConnection.ebayAccountStatus.hasEbayAccount ? 'bg-green-600' : 'bg-yellow-500'
          }`}></div>
          <div className="text-sm font-bold text-gray-900 mb-1">System Status</div>
          <div className="text-xs text-gray-800 font-medium">
            {(user?.ebayConnection?.isConnected || connections.ebay.isConnected) && 
             (user?.freeagentConnection?.isConnected || connections.freeagent.isConnected) && 
             freeagentConnection.ebayAccountStatus.hasEbayAccount ? 'Ready to Sync' : 'Setup Required'}
          </div>
        </div>
      </div>
    </div>
  );
};