import React, { useState, useEffect, useCallback } from 'react';
import { makeAuthenticatedRequest } from '../../utils/apiUtils';

interface AutoSyncTabProps {
  connections: any;
  setupStatus: any;
  ebayAccountStatus: any;
  user: any;
  isLoading: boolean;
}

export const AutoSyncTab: React.FC<AutoSyncTabProps> = ({
  connections,
  setupStatus,
  ebayAccountStatus,
  user,
  isLoading,
}) => {
  const [saving, setSaving] = useState(false);
  const [lagDays, setLagDays] = useState(2);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  
  // Date range state for initial sync
  const [initialSyncDate, setInitialSyncDate] = useState('');
  const [showDateRange, setShowDateRange] = useState(false);
  const [syncResults, setSyncResults] = useState<any>(null);
  
  // Simple message state
  const [msgText, setMsgText] = useState('');
  const [msgType, setMsgType] = useState('');

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (msgText) {
      const timer = setTimeout(() => {
        setMsgText('');
        setMsgType('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [msgText]);

  // Load current settings from user data
  useEffect(() => {
    if (user?.autoSync) {
      setAutoSyncEnabled(user.autoSync.enabled || false);
      setLagDays(user.autoSync.lagDays || 2);
    }
  }, [user]);

  // Initialize date to 30 days ago
  useEffect(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    setInitialSyncDate(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  // Helper to show messages
  const showMsg = (type: string, text: string) => {
    setMsgType(type);
    setMsgText(text);
  };

  // Calculate date range limits
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() - lagDays);
    return maxDate.toISOString().split('T')[0];
  };

  const getMinDate = () => {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - 730); // 2 years max history
    return minDate.toISOString().split('T')[0];
  };

  // Toggle auto-sync on/off
  const handleToggleAutoSync = async () => {
    setSaving(true);
    try {
      const response = await makeAuthenticatedRequest('/autosync/settings', {
        method: 'PUT',
        body: JSON.stringify({
          enabled: !autoSyncEnabled,
          lagDays: lagDays
        })
      });
      
      if (response.status === 'success') {
        setAutoSyncEnabled(!autoSyncEnabled);
        showMsg('success', `Auto-sync ${!autoSyncEnabled ? 'enabled' : 'disabled'} successfully!`);
      } else {
        console.error('Toggle failed:', response);
        showMsg('error', 'Failed to update auto-sync settings');
      }
    } catch (error) {
      console.error('Auto-sync toggle error:', error);
      showMsg('error', 'Network error - please try again');
    } finally {
      setSaving(false);
    }
  };

  // Update lag days
  const updateLagDays = (newLagDays: number) => {
    setLagDays(newLagDays);
    showMsg('info', `Transaction lag set to ${newLagDays} day${newLagDays > 1 ? 's' : ''}. Click "Save Settings" to apply.`);
  };

  // Save settings function
  const saveSettings = async (customLagDays?: number) => {
    setSaving(true);
    try {
      const response = await makeAuthenticatedRequest('/autosync/settings', {
        method: 'PUT',
        body: JSON.stringify({
          enabled: autoSyncEnabled,
          lagDays: customLagDays || lagDays
        })
      });
      
      if (response.status === 'success') {
        showMsg('success', 'Settings saved successfully!');
      } else {
        showMsg('error', 'Failed to save settings');
      }
    } catch (error) {
      console.error('Save settings error:', error);
      showMsg('error', 'Network error - please try again');
    } finally {
      setSaving(false);
    }
  };

  // Test sync with custom date range
  const testSync = async () => {
    if (!setupStatus.readyToSync) {
      showMsg('error', 'Please complete setup (connect accounts and select eBay seller account) before testing');
      return;
    }

    setSaving(true);
    setSyncResults(null);
    
    try {
      const response = await makeAuthenticatedRequest('/autosync/test-now', {
        method: 'POST',
        body: JSON.stringify({
          startDate: initialSyncDate,
          lagDays: lagDays
        })
      });

      if (response.status === 'success') {
        setSyncResults(response.data);
        showMsg('success', `Test completed: ${response.data?.result?.successful || 0} transactions processed`);
      } else {
        showMsg('error', response.message || 'Test sync failed');
      }
    } catch (error) {
      console.error('Test sync error:', error);
      showMsg('error', 'Test sync failed - please try again');
    } finally {
      setSaving(false);
    }
  };

  const readyToSync = setupStatus.readyToSync;

  return (
    <div className="space-y-6">
      {/* Message Display */}
      {msgText && (
        <div className={`p-3 rounded-lg text-sm ${
          msgType === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
          msgType === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
          'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          {msgText}
        </div>
      )}

      {/* Setup Status Alert */}
      {!readyToSync && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-yellow-800 text-sm">
            <strong>Setup Required:</strong> Complete account connections in the Connection Status section above before enabling auto-sync.
          </div>
        </div>
      )}

      {/* Auto-Sync Toggle */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Automated Daily Sync</h3>
            <p className="text-sm text-gray-600 mt-1">
              Automatically sync your eBay transactions to FreeAgent every day at 2:00 AM UK time
            </p>
          </div>
          <button
            onClick={handleToggleAutoSync}
            disabled={saving || !readyToSync}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              autoSyncEnabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                autoSyncEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Transaction Lag Settings */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Lag (Days)</h3>
        <p className="text-sm text-gray-600 mb-4">
          How many days to wait before syncing transactions (allows time for eBay to finalize payments)
        </p>
        
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((days) => (
            <button
              key={days}
              onClick={() => updateLagDays(days)}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                lagDays === days
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {days} day{days > 1 ? 's' : ''}
            </button>
          ))}
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          Recommended: 2 days (balances accuracy with speed)
        </p>
      </div>

      {/* Custom Date Range for Testing */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom Date Range for Testing</h3>
        <p className="text-sm text-gray-600 mb-4">
          Choose how far back to sync when testing (useful for initial setup)
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date for Testing
            </label>
            <input
              type="date"
              value={initialSyncDate}
              onChange={(e) => setInitialSyncDate(e.target.value)}
              min={getMinDate()}
              max={getMaxDate()}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {syncResults && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Last Test Results:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Date Range: {syncResults.dateRange?.startDate} to {syncResults.dateRange?.endDate}</div>
                <div>Transactions: {syncResults.result?.successful || 0} processed</div>
                <div>Duration: {Math.round((syncResults.result?.duration || 0) / 1000)}s</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
        
        <button
          onClick={testSync}
          disabled={saving || !readyToSync}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Testing...' : 'Test Now'}
        </button>
      </div>

      {/* Sync Status & Statistics */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sync Status & Statistics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Schedule</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Next sync: <span className="font-medium">14 Sept 2025, 02:00</span></div>
              <div>Last sync: <span className="font-medium">11 Sept 2025, 02:00</span></div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Performance</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Success rate: <span className="font-medium text-green-600">94%</span></div>
              <div>Total auto-syncs: <span className="font-medium">17</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};