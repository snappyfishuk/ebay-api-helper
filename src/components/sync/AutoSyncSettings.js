import React, { useState, useEffect } from "react";
import {
  Clock,
  Calendar,
  Settings,
  AlertCircle,
  CheckCircle,
  Play,
  X,
  Bell,
} from "lucide-react";

const AutoSyncSettings = () => {
  const [settings, setSettings] = useState({
    enabled: false,
    frequency: "manual",
    time: "08:00",
    lagDays: 3,
    notifications: {
      email: true,
      syncSuccess: false,
      syncFailure: true,
    },
  });

  const [syncStatus, setSyncStatus] = useState({
    lastAutoSync: null,
    nextScheduledSync: null,
    retryCount: 0,
    recentErrors: [],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // FIXED: Added /api to the URL
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/autosync/settings`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSettings({
          enabled: data.data.enabled,
          frequency: data.data.frequency,
          time: data.data.time,
          lagDays: data.data.lagDays,
          notifications: data.data.notifications,
        });

        setSyncStatus({
          lastAutoSync: data.data.lastAutoSync,
          nextScheduledSync: data.data.nextScheduledSync,
          retryCount: data.data.retryCount,
          recentErrors: data.data.recentErrors,
        });
      } else if (response.status === 401) {
        setMessage({
          type: "error",
          text: "Authentication failed. Please refresh the page and log in again.",
        });
      } else {
        setMessage({
          type: "error",
          text: `Failed to load auto-sync settings. Status: ${response.status}`,
        });
      }
    } catch (error) {
      console.error("Error fetching auto-sync settings:", error);
      setMessage({
        type: "error",
        text: "Network error connecting to backend.",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      // FIXED: Added /api to the URL
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/autosync/settings`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(settings),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessage({ type: "success", text: data.message });
        setSyncStatus((prev) => ({
          ...prev,
          nextScheduledSync: data.data.nextScheduledSync,
        }));
      } else if (response.status === 401) {
        setMessage({
          type: "error",
          text: "Authentication failed. Please refresh the page and log in again.",
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        setMessage({
          type: "error",
          text:
            errorData.message ||
            `Failed to save settings. Status: ${response.status}`,
        });
      }
    } catch (error) {
      console.error("Error saving auto-sync settings:", error);
      setMessage({
        type: "error",
        text: "Network error connecting to backend.",
      });
    } finally {
      setSaving(false);
    }
  };

  const testAutoSync = async () => {
    setTesting(true);
    setMessage({ type: "", text: "" });

    try {
      // FIXED: Added /api to the URL
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/autosync/test`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessage({
          type: "success",
          text: `Test completed: ${
            data.data.successful || 0
          } transactions synced`,
        });
      } else if (response.status === 401) {
        setMessage({
          type: "error",
          text: "Authentication failed. Please refresh the page and log in again.",
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        setMessage({
          type: "error",
          text: errorData.message || `Test failed. Status: ${response.status}`,
        });
      }
    } catch (error) {
      console.error("Error testing auto-sync:", error);
      setMessage({
        type: "error",
        text: "Network error connecting to backend.",
      });
    } finally {
      setTesting(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });
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
              Automatically sync your eBay transactions to FreeAgent daily, just
              like Amazon integration
            </p>
          </div>
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
              settings.enabled
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {settings.enabled ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Active
              </>
            ) : (
              <>
                <X className="h-4 w-4" />
                Inactive
              </>
            )}
          </div>
        </div>
      </div>

      {/* Status Message */}
      {message.text && (
        <div
          className={`rounded-lg p-4 ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            {message.text}
          </div>
        </div>
      )}

      {/* Current Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Sync Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-600">Last Auto-Sync</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatDateTime(syncStatus.lastAutoSync)}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-600">Next Scheduled</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatDateTime(syncStatus.nextScheduledSync)}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-600">Retry Count</p>
            <p
              className={`text-lg font-semibold ${
                syncStatus.retryCount > 0 ? "text-orange-600" : "text-gray-900"
              }`}
            >
              {syncStatus.retryCount}/3
            </p>
          </div>
        </div>
      </div>

      {/* Main Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Auto-Sync Configuration
        </h3>

        <div className="space-y-6">
          {/* Enable Auto-Sync */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Enable Auto-Sync
              </label>
              <p className="text-sm text-gray-500">
                Automatically sync transactions with 3-day delay (like
                FreeAgent's Amazon integration)
              </p>
            </div>
            <button
              onClick={() =>
                setSettings((prev) => ({ ...prev, enabled: !prev.enabled }))
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.enabled ? "bg-blue-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.enabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sync Frequency
            </label>
            <select
              value={settings.frequency}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, frequency: e.target.value }))
              }
              disabled={!settings.enabled}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="manual">Manual Only</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>

          {/* Time */}
          {settings.frequency !== "manual" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sync Time
                </label>
                <input
                  type="time"
                  value={settings.time}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, time: e.target.value }))
                  }
                  disabled={!settings.enabled}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
            </div>
          )}

          {/* Lag Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Lag Days
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={settings.lagDays}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  lagDays: parseInt(e.target.value),
                }))
              }
              disabled={!settings.enabled}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
            />
            <p className="text-sm text-gray-500 mt-1">
              Days to wait before syncing transactions (3 days recommended, like
              FreeAgent's Amazon integration)
            </p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Email Notifications
              </label>
              <p className="text-sm text-gray-500">
                Receive email notifications for sync events
              </p>
            </div>
            <button
              onClick={() =>
                setSettings((prev) => ({
                  ...prev,
                  notifications: {
                    ...prev.notifications,
                    email: !prev.notifications.email,
                  },
                }))
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.notifications.email ? "bg-blue-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.notifications.email
                    ? "translate-x-6"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {settings.notifications.email && (
            <div className="pl-4 space-y-3 border-l-2 border-gray-100">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-600">
                  Notify on successful sync
                </label>
                <button
                  onClick={() =>
                    setSettings((prev) => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        syncSuccess: !prev.notifications.syncSuccess,
                      },
                    }))
                  }
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    settings.notifications.syncSuccess
                      ? "bg-blue-600"
                      : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      settings.notifications.syncSuccess
                        ? "translate-x-5"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-600">
                  Notify on sync failures
                </label>
                <button
                  onClick={() =>
                    setSettings((prev) => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        syncFailure: !prev.notifications.syncFailure,
                      },
                    }))
                  }
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    settings.notifications.syncFailure
                      ? "bg-blue-600"
                      : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      settings.notifications.syncFailure
                        ? "translate-x-5"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Errors */}
      {syncStatus.recentErrors && syncStatus.recentErrors.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Recent Sync Errors
          </h3>

          <div className="space-y-3">
            {syncStatus.recentErrors.map((error, index) => (
              <div
                key={index}
                className="bg-red-50 border border-red-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-red-800 font-medium">
                      {formatDateTime(error.date)}
                    </p>
                    <p className="text-sm text-red-700 mt-1">{error.error}</p>
                  </div>
                  {error.resolved && (
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                      Resolved
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Settings className="h-4 w-4" />
            )}
            {saving ? "Saving..." : "Save Settings"}
          </button>

          <button
            onClick={testAutoSync}
            disabled={testing || !settings.enabled}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {testing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Play className="h-4 w-4" />
            )}
            {testing ? "Testing..." : "Test Auto-Sync"}
          </button>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            How Auto-Sync Works (FreeAgent Pattern)
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              • Transactions are synced with a {settings.lagDays}-day delay
              (like Amazon integration)
            </li>
            <li>• Automatic duplicate detection prevents double-entries</li>
            <li>• Failed syncs are automatically retried up to 3 times</li>
            <li>• Auto-sync is disabled after max retries to prevent errors</li>
            <li>• All sync activity is logged for your review</li>
          </ul>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Need Help?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              Why use a 3-day delay?
            </h4>
            <p>
              Like FreeAgent's Amazon integration, the 3-day delay ensures all
              transaction details are finalized before syncing, reducing errors
              and corrections.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              What if sync fails?
            </h4>
            <p>
              The system automatically retries up to 3 times. After that,
              auto-sync is paused and you'll receive a notification to resolve
              any issues.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoSyncSettings;
