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
      const response = await fetch('/api/autosync/settings', {
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
        text: 'Network error loading settings',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage({ type: 'info', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/autosync/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: settings.enabled,
          lagDays: settings.lagDays,
          notifications: settings.notifications,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(prevSettings => ({ ...prevSettings, ...data.data }));
        setMessage({
          type: 'success',
          text: data.message,
        });
      } else if (response.status === 401) {
        setMessage({
          type: 'error',
          text: 'Please refresh the page and log in again.',
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        setMessage({
          type: 'error',
          text: errorData.message || `Failed to save settings. Status: ${response.status}`,
        });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({
        type: 'error',
        text: 'Network error saving settings.',
      });
    } finally {
      setSaving(false);
    }
  };

  const testAutoSync = async () => {
    setTesting(true);
    setMessage({ type: 'info', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/autosync/test-now', {
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
          text: `Test completed! ${data.data.result?.successful || 0} transactions processed.`,
        });
      } else if (response.status === 401) {
        setMessage({
          type: 'error',
          text: 'Please refresh the page and log in again.',
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

  const toggleAutoSync = () => {
    setSettings(prev => ({ ...prev, enabled: !prev.enabled }));
  };

  const updateLagDays = (days: number) => {
    setSettings(prev => ({ ...prev, lagDays: days }));
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
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : message.type === 'error' ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <Info className="h-4 w-4" />
            )}
            {message.text}
          </div>
        </div>
      )}

      {/* Fixed Settings Display */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Fixed Schedule (Like FreeAgent Amazon)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-800">Sync Time:</span>
                <div className="text-blue-700">{settings.fixedSettings.syncTime}</div>
              </div>
              <div>
                <span className="font-medium text-blue-800">Frequency:</span>
                <div className="text-blue-700">{settings.fixedSettings.frequency}</div>
              </div>
              <div>
                <span className="font-medium text-blue-800">Timezone:</span>
                <div className="text-blue-700">{settings.fixedSettings.timezone}</div>
              </div>
            </div>
            <p className="text-blue-700 text-sm mt-2">
              No time selection needed - automatically syncs at the optimal time for eBay transactions
            </p>
          </div>
        </div>
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
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  settings.lagDays === days
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
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
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
            disabled={testing || !settings.enabled}
            className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
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