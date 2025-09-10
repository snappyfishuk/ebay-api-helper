import React, { useState, useEffect } from 'react';
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
  
  // ADD: Date range state for initial sync
  const [initialSyncDate, setInitialSyncDate] = useState('');
  const [showDateRange, setShowDateRange] = useState(false);
  const [syncResults, setSyncResults] = useState<any>(null);
  
  // Simple message state - just string for message, string for type
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

  // ADD: Initialize date to 30 days ago
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

  // ADD: Calculate date range limits
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() - lagDays);
    return maxDate.toISOString().split('T')[0];
  };

  const getMinDate = () => {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - 730); // 2 years (730 days) max history
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
        console.error('Save failed:', response);
        showMsg('error', 'Failed to save settings');
      }
    } catch (error) {
      console.error('Save settings error:', error);
      showMsg('error', 'Network error - please try again');
    } finally {
      setSaving(false);
    }
  };

  // UPDATED: Test sync function with date range support
  const testAutoSync = async () => {
    setSaving(true);
    setSyncResults(null);
    
    try {
      // Calculate end date (today minus lag days)
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - lagDays);
      
      // Build request body with optional date range
      const requestBody: any = {};
      if (showDateRange && initialSyncDate) {
        requestBody.dateRange = {
          startDate: initialSyncDate,
          endDate: endDate.toISOString().split('T')[0]
        };
      }
      
      const response = await makeAuthenticatedRequest('/autosync/test', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      
      if (response.status === 'success') {
        setSyncResults(response.data);
        const transactions = response.data?.successful || response.data?.totalTransactions || 0;
        showMsg('success', `Test sync completed! Synced ${transactions} transactions.`);
      } else {
        console.error('Test failed:', response);
        showMsg('error', 'Test sync failed - check console for details');
      }
    } catch (error) {
      console.error('Test sync error:', error);
      showMsg('error', 'Network error during test - please try again');
    } finally {
      setSaving(false);
    }
  };

  if (!setupStatus.readyToSync) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="text-center">
          <div className="text-2xl mb-2">⚠️</div>
          <h4 className="text-lg font-semibold text-yellow-800 mb-2">Setup Required</h4>
          <p className="text-yellow-700 text-sm mb-4">
            Complete your eBay and FreeAgent connections to enable auto-sync.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Message Display - Single location */}
      {msgText && (
        <div className={`rounded-lg p-4 ${
          msgType === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : msgType === 'error'
            ? 'bg-red-50 text-red-800 border border-red-200'
            : 'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          {msgText}
        </div>
      )}

      {/* Auto-Sync Toggle & Configuration */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Automated Daily Sync
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Automatically sync your eBay transactions to FreeAgent every day at 2:00 AM UK time
            </p>
          </div>
          <button
            onClick={handleToggleAutoSync}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              autoSyncEnabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                autoSyncEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {autoSyncEnabled && (
          <div className="space-y-6">
            {/* Transaction Lag Configuration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Transaction Lag (Days)
              </label>
              <p className="text-xs text-gray-500 mb-3">
                How many days to wait before syncing transactions (allows time for eBay to finalize payments)
              </p>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((days) => (
                  <button
                    key={days}
                    onClick={() => updateLagDays(days)}
                    className={`py-2 px-3 text-sm font-medium rounded border transition-colors ${
                      lagDays === days
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {days} day{days > 1 ? 's' : ''}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">Recommended: 2 days (balances accuracy with speed)</p>
            </div>

            {/* ADD: Date Range Selection */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Custom Date Range for Testing
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Choose how far back to sync when testing (useful for initial setup)
                  </p>
                </div>
                <button
                  onClick={() => setShowDateRange(!showDateRange)}
                  className={`text-sm px-3 py-1 rounded border transition-colors ${
                    showDateRange 
                      ? 'bg-blue-50 text-blue-700 border-blue-300' 
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {showDateRange ? 'Hide' : 'Show'} Date Range
                </button>
              </div>

              {showDateRange && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sync transactions from:
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
                  <div className="text-sm text-gray-600">
                    <div>
                      <strong>Date range:</strong> {new Date(initialSyncDate).toLocaleDateString('en-GB')} to {new Date(getMaxDate()).toLocaleDateString('en-GB')}
                    </div>
                    <div>
                      <strong>Total days:</strong> {Math.ceil((new Date(getMaxDate()).getTime() - new Date(initialSyncDate).getTime()) / (1000 * 60 * 60 * 24))} days
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={() => saveSettings()}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
              <button
                onClick={testAutoSync}
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Testing...' : 'Test Now'}
              </button>
            </div>

            {/* ADD: Sync Results Display */}
            {syncResults && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Test Results</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-blue-700">Total Transactions:</span>
                    <span className="ml-2 font-semibold text-blue-900">{syncResults.totalTransactions || 0}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Successful:</span>
                    <span className="ml-2 font-semibold text-green-700">{syncResults.successful || 0}</span>
                  </div>
                  {syncResults.dateRange && (
                    <>
                      <div>
                        <span className="text-blue-700">Period:</span>
                        <span className="ml-2 font-semibold text-blue-900">{syncResults.dateRange.daySpan || 0} days</span>
                      </div>
                      <div>
                        <span className="text-blue-700">Duration:</span>
                        <span className="ml-2 font-semibold text-blue-900">
                          {syncResults.duration ? `${(syncResults.duration / 1000).toFixed(1)}s` : 'N/A'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sync Status & Statistics */}
      <div className="bg-white border rounded-lg p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Sync Status & Statistics</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Schedule</div>
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-gray-600">Next sync:</span>{' '}
                <span className="font-medium">
                  {user?.autoSync?.nextScheduledSync ? (
                    new Date(user.autoSync.nextScheduledSync).toLocaleString('en-GB', {
                      timeZone: 'Europe/London',
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })
                  ) : (
                    <span className="text-gray-500">Not scheduled</span>
                  )}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Last sync:</span>{' '}
                <span className="font-medium">
                  {user?.autoSync?.lastAutoSync ? (
                    new Date(user.autoSync.lastAutoSync).toLocaleString('en-GB', {
                      timeZone: 'Europe/London',
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })
                  ) : (
                    <span className="text-gray-500">No syncs yet</span>
                  )}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Performance</div>
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-gray-600">Success rate:</span>{' '}
                <span className="font-medium">
                  {user?.autoSync?.stats?.successfulAutoSyncs && user?.autoSync?.stats?.totalAutoSyncs ? (
                    `${Math.round((user.autoSync.stats.successfulAutoSyncs / user.autoSync.stats.totalAutoSyncs) * 100)}%`
                  ) : (
                    <span className="text-gray-500">No data</span>
                  )}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Total auto-syncs:</span>{' '}
                <span className="font-medium">
                  {user?.autoSync?.stats?.totalAutoSyncs || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};