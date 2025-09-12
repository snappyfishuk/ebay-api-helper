// components/ConnectionStatusCards.tsx
import React, { useState, useEffect } from 'react';
import { makeAuthenticatedRequest } from '../utils/apiUtils';

interface ConnectionStatusCardsProps {
  user: any;
  connections: any;
  freeagentConnection: any;
  ebayConnection: any;
  onUpdateTransferAccount?: () => void;
}

interface BankAccount {
  id: string;
  name: string;
  type: string;
  currency: string;
  currentBalance: number;
  apiUrl: string;
}

export const ConnectionStatusCards: React.FC<ConnectionStatusCardsProps> = ({
  user,
  connections,
  freeagentConnection,
  ebayConnection,
  onUpdateTransferAccount
}) => {
  const [showTransferAccountModal, setShowTransferAccountModal] = useState(false);
  const [availableBankAccounts, setAvailableBankAccounts] = useState<BankAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedTransferAccount, setSelectedTransferAccount] = useState<string>('');

  // Get current transfer destination account info
  const currentTransferAccount = user?.settings?.freeagent?.mainBankAccount;
  const currentTransferAccountName = user?.settings?.freeagent?.mainBankAccountName || 'Not configured';

  // Load bank accounts when modal opens
  const loadBankAccounts = async () => {
    if (!connections?.freeagent?.isConnected) return;
    
    setLoadingAccounts(true);
    try {
      const response = await makeAuthenticatedRequest('/freeagent/bank-accounts', {
        method: 'GET'
      });
      
      if (response.status === 'success' && response.data?.bankAccounts) {
        setAvailableBankAccounts(response.data.bankAccounts);
      }
    } catch (error) {
      console.error('Error loading bank accounts:', error);
    } finally {
      setLoadingAccounts(false);
    }
  };

  // Save selected transfer account
  const saveTransferAccount = async () => {
    if (!selectedTransferAccount) return;
    
    setSaving(true);
    try {
      const selectedAccount = availableBankAccounts.find(acc => acc.apiUrl === selectedTransferAccount);
      
      const response = await makeAuthenticatedRequest('/autosync/transfer-settings', {
        method: 'PUT',
        body: JSON.stringify({
          autoTransferEnabled: user?.settings?.freeagent?.autoTransferEnabled || false,
          mainBankAccount: selectedTransferAccount,
          mainBankAccountName: selectedAccount?.name || '',
        })
      });
      
      if (response.status === 'success') {
        setShowTransferAccountModal(false);
        onUpdateTransferAccount?.();
        // Optionally show success message
      }
    } catch (error) {
      console.error('Error saving transfer account:', error);
    } finally {
      setSaving(false);
    }
  };

  const openTransferAccountModal = () => {
    setSelectedTransferAccount(currentTransferAccount || '');
    setShowTransferAccountModal(true);
    loadBankAccounts();
  };

  return (
    <>
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

          {/* eBay Bank Account Status */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-300 rounded-lg p-4 text-center">
            <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${freeagentConnection.ebayAccountStatus.hasEbayAccount ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            <div className="text-sm font-bold text-green-900 mb-1">eBay Seller Account</div>
            <div className="text-xs text-green-800 truncate font-medium mb-3" title={
              freeagentConnection.ebayAccountStatus.hasEbayAccount 
                ? (freeagentConnection.ebayAccountStatus.bankAccount?.name || 'eBay UK seller Account')
                : 'Setup needed'
            }>
              {freeagentConnection.ebayAccountStatus.hasEbayAccount 
                ? (freeagentConnection.ebayAccountStatus.bankAccount?.name || 'eBay UK seller Account')
                : 'Setup needed'}
            </div>
            
            {freeagentConnection.ebayAccountStatus.hasEbayAccount ? (
              <span className="text-xs text-green-600 font-medium">Configured</span>
            ) : (
              <span className="text-xs text-gray-500 font-medium">Setup Required</span>
            )}
          </div>

          {/* NEW: Transfer Destination Account Card */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-lg p-4 text-center">
            <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${currentTransferAccount ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            <div className="text-sm font-bold text-purple-900 mb-1">Transfer Destination</div>
            <div className="text-xs text-purple-800 truncate font-medium mb-3" title={currentTransferAccountName}>
              {currentTransferAccount ? currentTransferAccountName : 'Not configured'}
            </div>
            
            {connections?.freeagent?.isConnected ? (
              <button
                onClick={openTransferAccountModal}
                className="w-full px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors"
              >
                {currentTransferAccount ? 'Change Account' : 'Select Account'}
              </button>
            ) : (
              <span className="text-xs text-gray-500 font-medium">Connect FreeAgent first</span>
            )}
          </div>
        </div>

        {/* Helper text for transfer account */}
        {connections?.freeagent?.isConnected && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>Transfer Destination:</strong> This is your main business bank account where eBay payouts are deposited (e.g., Mettle, Starling, etc.). 
              Auto-transfers will create matching outgoing transactions from your eBay Seller Account to this account.
            </div>
          </div>
        )}
      </div>

      {/* Transfer Account Selection Modal */}
      {showTransferAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Select Transfer Destination Account</h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                Choose your main business bank account where eBay payouts are deposited.
              </p>
              
              {loadingAccounts ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading bank accounts...</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availableBankAccounts.map((account) => (
                    <label key={account.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="transferAccount"
                        value={account.apiUrl}
                        checked={selectedTransferAccount === account.apiUrl}
                        onChange={(e) => setSelectedTransferAccount(e.target.value)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{account.name}</div>
                        <div className="text-xs text-gray-500">
                          {account.type} • {account.currency} • Balance: £{account.currentBalance?.toFixed(2) || '0.00'}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowTransferAccountModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveTransferAccount}
                disabled={!selectedTransferAccount || saving}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Selection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};