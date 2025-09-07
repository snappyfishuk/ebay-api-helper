// src/components/sync/AutoSyncSettings.tsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, X, Clock, Settings, Play, AlertTriangle, Info } from 'lucide-react';

interface AutoSyncSettings {
  enabled: boolean;
  lagDays: number;
  lastAutoSync?: string;
  nextScheduledSync?: string;
  retryCount: number;
  notifications: {
    email: boolean;
    syncSuccess: boolean;
    syncFailure: boolean;
  };
  stats: {
    totalAutoSyncs: number;
    successfulAutoSyncs: number;
    failedAutoSyncs: number;
    averageTransactionsPerSync: number;
  };
  weeklyStats?: {
    totalSyncs: number;
    totalTransactions: number;
    successfulSyncs: number;
    lastSyncDate: string | null;
    summary: string;
  };
  fixedSettings: {
    syncTime: string;
    timezone: string;
    frequency: string;
    description: string;
  };
}

interface Message {
  type: 'success' | 'error' | 'info';
  text: string;
}

const AutoSyncSettings: React.FC = () => {
  const [settings, setSettings] = useState<AutoSyncSettings>({
    enabled: false,
    lagDays: 2,
    retryCount: 0,
    notifications: {
      email: true,
      syncSuccess: false,
      syncFailure: true,
    },
    stats: {
      totalAutoSyncs: 0,
      successfulAutoSyncs: 0,
      failedAutoSyncs: 0,
      averageTransactionsPerSync: 0,
    },
    weeklyStats: {
      totalSyncs: 0,
      totalTransactions: 0,
      successfulSyncs: 0,
      lastSyncDate: null,
      summary: 'No syncs in the past week'
    },
    fixedSettings: {
      syncTime: '02:00 AM',
      timezone: 'UK Time',
      frequency: 'Daily',
      description: 'Syncs daily at 2:00 AM UK time, just like FreeAgent\'s Amazon integration'
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<Message>({ type: 'info', text: '' });

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/autosync/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.data);
      } else {
        setMessage({
          type: 'error',
          text: 'Failed to load auto-sync settings',
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage({
        type: 'error',
        text: 'Failed to connect to the server',
      });
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Save settings function with proper API call
  const saveSettings = async () => {
    console.log('💾 Save Settings clicked!', settings);
    setSaving(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/autosync/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: settings.enabled,
          lagDays: settings.lagDays,
          notifications: settings.notifications
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({
          type: 'success',
          text: 'Auto-sync settings saved successfully!',
        });
        // Update settings with response data
        if (data.data) {
          setSettings(prev => ({ ...prev, ...data.data }));
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setMessage({
          type: 'error',
          text: errorData.message || `Save failed. Status: ${response.status}`,
        });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({
        type: 'error',
        text: 'Network error - unable to save settings',
      });
    } finally {
      setSaving(false);
    }
  };

  // FIXED: Test auto-sync function with correct endpoint
  const testAutoSync = async () => {
    console.log('🧪 Test Now clicked!');
    setTesting(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/autosync/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({
          type: 'success',
          text: data.message || 'Test sync completed successfully!',
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        setMessage({
          type: 'error',
          text: errorData.message || `Test failed. Status: ${response.status}`,
        });
      }
    } catch (error) {
      console.error('Error testing auto-sync:', error);
      setMessage({
        type: 'error',
        text: 'Network error connecting to backend.',
      });
    } finally {
      setTesting(false);
    }
  };

  // FIXED: Toggle auto-sync with API call
  const toggleAutoSync = async () => {
    console.log('🔄 Toggle clicked! Current:', settings.enabled);
    const newEnabled = !settings.enabled;
    
    // Update local state immediately for UI responsiveness
    setSettings(prev => ({ ...prev, enabled: newEnabled }));
    
    // Save the change
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/autosync/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: newEnabled,
          lagDays: settings.lagDays,
          notifications: settings.notifications
        }),
      });

      if (response.ok) {
        setMessage({
          type: 'success',
          text: `Auto-sync ${newEnabled ? 'enabled' : 'disabled'} successfully!`,
        });
      } else {
        // Revert on failure
        setSettings(prev => ({ ...prev, enabled: !newEnabled }));
        setMessage({
          type: 'error',
          text: 'Failed to update auto-sync setting',
        });
      }
    } catch (error) {
      // Revert on failure
      setSettings(prev => ({ ...prev, enabled: !newEnabled }));
      console.error('Error toggling auto-sync:', error);
      setMessage({
        type: 'error',
        text: 'Network error - please try again',
      });
    } finally {
      setSaving(false);
    }
  };

  // FIXED: Update lag days with auto-save
  const updateLagDays = async (days: number) => {
    console.log('📅 Lag days clicked:', days);
    setSettings(prev => ({ ...prev, lagDays: days }));
    
    // Auto-save when lag days change
    if (settings.enabled) {
      setSaving(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/autosync/settings`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            enabled: settings.enabled,
            lagDays: days,
            notifications: settings.notifications
          }),
        });

        if (response.ok) {
          setMessage({
            type: 'success',
            text: `Lag days updated to ${days} day${days > 1 ? 's' : ''}`,
          });
        } else {
          setMessage({
            type: 'error',
            text: 'Failed to update lag days',
          });
        }
      } catch (error) {
        console.error('Error updating lag days:', error);
        setMessage({
          type: 'error',
          text: 'Network error updating lag days',
        });
      } finally {
        setSaving(false);
      }
    }
  };

  const updateNotifications = (key: keyof typeof settings.notifications, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value }
    }));
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const getStatusIcon = () => {
    if (!settings.enabled) return <X className="h-4 w-4" />;
    if (settings.retryCount >= 3) return <AlertTriangle className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Debug Info - Remove this after testing */}
      <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-sm">
        <p><strong>Debug:</strong> API URL: {process.env.REACT_APP_API_URL}</p>
        <p><strong>Token:</strong> {localStorage.getItem('token') ? 'Present' : 'Missing'}</p>
      </div>

      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-6 w-6 text-blue-600" />
              Auto-Sync Settings
            </h2>
            <p className="text-gray-600 mt-1">
              {settings.fixedSettings.description}
            </p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
            settings.enabled
              ? settings.retryCount >= 3
                ? 'bg-red-100 text-red-800'
                : 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {getStatusIcon()}
            {settings.enabled 
              ? settings.retryCount >= 3 
                ? 'Paused' 
                : 'Active'
              : 'Inactive'
            }
          </div>
        </div>
      </div>

      {/* Status Message */}
      {message.text && (
        <div className={`rounded-lg p-4 ${
          message.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : message.type === 'error'
            ? 'bg-red-50 text-red-800 border border-red-200'
            : 'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {message.type === 'success' && <CheckCircle className="h-5 w-5" />}
              {message.type === 'error' && <X className="h-5 w-5" />}
              {message.type === 'info' && <Info className="h-5 w-5" />}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Schedule Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Fixed Schedule (Like FreeAgent Amazon)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-900">{settings.fixedSettings.syncTime}</div>
            <div className="text-sm text-blue-700">Sync Time</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-900">{settings.fixedSettings.frequency}</div>
            <div className="text-sm text-blue-700">Frequency</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-900">{settings.fixedSettings.timezone}</div>
            <div className="text-sm text-blue-700">Timezone</div>
          </div>
        </div>
        <p className="text-blue-700 text-sm mt-2">
          No time selection needed - automatically syncs at the optimal time for eBay transactions
        </p>
      </div>

      {/* Main Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Auto-Sync Control
        </h3>

        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-6">
          <div>
            <h4 className="font-medium text-gray-900">Enable Auto-Sync</h4>
            <p className="text-sm text-gray-600">
              Automatically sync eBay transactions daily at 2:00 AM UK time
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={toggleAutoSync}
              disabled={saving}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Lag Days Setting */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Transaction Lag (Days)
          </label>
          <p className="text-sm text-gray-600 mb-3">
            Wait this many days before syncing transactions (reduced from Amazon's 3 days for faster eBay processing)
          </p>
          <div className="flex gap-2">
            {[1, 2, 3].map((days) => (
              <button
                key={days}
                onClick={() => updateLagDays(days)}
                disabled={saving}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  settings.lagDays === days
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {days} day{days > 1 ? 's' : ''}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Recommended: 2 days (balances accuracy with speed)
          </p>
        </div>

        {/* Notifications */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Email Notifications</h4>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.notifications.syncFailure}
                onChange={(e) => updateNotifications('syncFailure', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Sync failures</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.notifications.syncSuccess}
                onChange={(e) => updateNotifications('syncSuccess', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Sync successes</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </button>
          <button
            onClick={testAutoSync}
            disabled={testing || !settings.enabled || saving}
            className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {testing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Testing...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Test Now
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sync Status</h3>
        
        {/* Weekly Summary */}
        {settings.weeklyStats && (
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-900 mb-2">This Week's Activity</h4>
            <p className="text-blue-800 text-sm">
              {settings.weeklyStats.summary}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Schedule</h4>
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-gray-600">Next sync:</span>{' '}
                <span className="font-medium">
                  {formatDateTime(settings.nextScheduledSync)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Last sync:</span>{' '}
                <span className="font-medium">
                  {formatDateTime(settings.lastAutoSync)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Retry count:</span>{' '}
                <span className={`font-medium ${settings.retryCount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {settings.retryCount}/3
                </span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Statistics</h4>
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-gray-600">Total syncs:</span>{' '}
                <span className="font-medium">{settings.stats.totalAutoSyncs}</span>
              </div>
              <div>
                <span className="text-gray-600">Successful:</span>{' '}
                <span className="font-medium text-green-600">{settings.stats.successfulAutoSyncs}</span>
              </div>
              <div>
                <span className="text-gray-600">Failed:</span>{' '}
                <span className="font-medium text-red-600">{settings.stats.failedAutoSyncs}</span>
              </div>
              <div>
                <span className="text-gray-600">Avg transactions:</span>{' '}
                <span className="font-medium">{settings.stats.averageTransactionsPerSync}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoSyncSettings;