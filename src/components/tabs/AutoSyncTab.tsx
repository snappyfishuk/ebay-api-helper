import React, { useState, useEffect } from 'react';

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

  // Load current settings from user data
  useEffect(() => {
    if (user?.autoSync) {
      setAutoSyncEnabled(user.autoSync.enabled || false);
      setLagDays(user.autoSync.lagDays || 2);
    }
  }, [user]);

  // Toggle auto-sync on/off
  const handleToggleAutoSync = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/autosync/settings`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            enabled: !autoSyncEnabled,
            lagDays: lagDays
          })
        }
      );
      
      if (response.ok) {
        setAutoSyncEnabled(!autoSyncEnabled);
        alert('Auto-sync settings updated successfully!');
      } else {
        const error = await response.text();
        console.error('Toggle failed:', error);
        alert('Failed to update auto-sync settings');
      }
    } catch (error) {
      console.error('Auto-sync toggle error:', error);
      alert('Network error - please try again');
    } finally {
      setSaving(false);
    }
  };

  // Update lag days
  const updateLagDays = async (newLagDays: number) => {
    setLagDays(newLagDays);
    
    // Auto-save when auto-sync is enabled
    if (autoSyncEnabled) {
      await saveSettings(newLagDays);
    }
  };

  // Save settings function
  const saveSettings = async (customLagDays?: number) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/autosync/settings`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            enabled: autoSyncEnabled,
            lagDays: customLagDays || lagDays
          })
        }
      );
      
      if (response.ok) {
        alert('Settings saved successfully!');
      } else {
        const error = await response.text();
        console.error('Save failed:', error);
        alert('Failed to save settings');
      }
    } catch (error) {
      console.error('Save settings error:', error);
      alert('Network error - please try again');
    } finally {
      setSaving(false);
    }
  };

  // Test sync function
  const testAutoSync = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/autosync/test`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );
      
      if (response.ok) {
        const result = await response.json();
        alert(`Test sync completed! ${result.message || 'Check sync history for results.'}`);
      } else {
        const error = await response.text();
        console.error('Test failed:', error);
        alert('Test sync failed - check console for details');
      }
    } catch (error) {
      console.error('Test sync error:', error);
      alert('Network error during test - please try again');
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
      {/* Auto-Sync Status Card */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-lg font-semibold text-green-800">Auto-Sync Settings</h4>
            <p className="text-green-700 text-sm">Syncs daily at 2:00 AM UK time</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            autoSyncEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
          }`}>
            {autoSyncEnabled ? 'Active' : 'Inactive'}
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center text-green-700">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span>Daily sync at 2:00 AM UK time</span>
          </div>
          <div className="flex items-center text-green-700">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 717 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414L2.586 7l3.707-3.707a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>{lagDays} day lag for eBay processing</span>
          </div>
        </div>
      </div>

      {/* Fixed Schedule Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="text-md font-semibold text-blue-800 mb-3">Fixed Schedule (Like FreeAgent Amazon)</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-blue-700 font-medium">Sync Time:</span>
            <div className="text-blue-600">02:00 AM</div>
          </div>
          <div>
            <span className="text-blue-700 font-medium">Frequency:</span>
            <div className="text-blue-600">Daily</div>
          </div>
          <div>
            <span className="text-blue-700 font-medium">Timezone:</span>
            <div className="text-blue-600">UK Time</div>
          </div>
        </div>
        <p className="text-blue-600 text-xs mt-2">
          No time selection needed - automatically syncs at the optimal time for eBay transactions
        </p>
      </div>

      {/* Auto-Sync Controls */}
      <div className="bg-white border rounded-lg p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Auto-Sync Control</h4>
        
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="font-medium text-gray-900">Enable Auto-Sync</div>
            <div className="text-sm text-gray-600">Automatically sync eBay transactions daily at 2:00 AM UK time</div>
          </div>
          <button
            onClick={handleToggleAutoSync}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
              autoSyncEnabled ? 'bg-green-600' : 'bg-gray-200'
            } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                autoSyncEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Transaction Lag Options */}
        <div className="mb-6">
          <div className="font-medium text-gray-900 mb-2">Transaction Lag (Days)</div>
          <div className="text-sm text-gray-600 mb-3">
            Wait 1, 2 or 3 days before syncing transactions (reduced from Amazon's 3 days for faster eBay processing)
          </div>
          <div className="flex space-x-2">
            {[1, 2, 3].map((days) => (
              <button
                key={days}
                onClick={() => updateLagDays(days)}
                disabled={saving}
                className={`px-3 py-1 text-sm rounded font-medium transition-colors ${
                  lagDays === days
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {days} day{days > 1 ? 's' : ''}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">Recommended: 2 days (balances accuracy with speed)</p>
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
      </div>

      {/* Sync Status */}
      <div className="bg-white border rounded-lg p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Sync Status</h4>
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
                    <span className="text-gray-500">Never</span>
                  )}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Retry count:</span>{' '}
                <span className="font-medium">{user?.autoSync?.retryCount || 0}/3</span>
              </div>
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Statistics</div>
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-gray-600">Total syncs:</span>{' '}
                <span className="font-medium">{user?.autoSync?.stats?.totalAutoSyncs || 0}</span>
              </div>
              <div>
                <span className="text-gray-600">Successful:</span>{' '}
                <span className="font-medium text-green-600">{user?.autoSync?.stats?.successfulAutoSyncs || 0}</span>
              </div>
              <div>
                <span className="text-gray-600">Failed:</span>{' '}
                <span className="font-medium text-red-600">{user?.autoSync?.stats?.failedAutoSyncs || 0}</span>
              </div>
              <div>
                <span className="text-gray-600">Avg transactions:</span>{' '}
                <span className="font-medium">{user?.autoSync?.stats?.averageTransactionsPerSync || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};