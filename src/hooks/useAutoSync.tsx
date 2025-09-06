// src/hooks/useAutoSync.js

import { useState, useEffect, useCallback } from "react";
import { autoSyncService } from "../services/autoSyncService";

/**
 * Custom hook for managing auto-sync settings and operations
 */
export const useAutoSync = () => {
  // State management
  const [settings, setSettings] = useState({
    enabled: false,
    frequency: "manual",
    time: "08:00",
    timezone: "Europe/London",
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

  const [connectionStatus, setConnectionStatus] = useState({
    ebay: { connected: false },
    freeagent: { connected: false },
    bothConnected: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch auto-sync settings from backend
  const fetchAutoSyncSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [settingsResponse, connectionsResponse] = await Promise.all([
        autoSyncService.getSettings(),
        autoSyncService.getConnectionStatus(),
      ]);

      // Update settings state
      if (settingsResponse.status === "success") {
        const data = settingsResponse.data;
        setSettings({
          enabled: data.enabled || false,
          frequency: data.frequency || "manual",
          time: data.time || "08:00",
          timezone: data.timezone || "Europe/London",
          lagDays: data.lagDays || 3,
          notifications: {
            email: data.notifications?.email !== false,
            syncSuccess: data.notifications?.syncSuccess || false,
            syncFailure: data.notifications?.syncFailure !== false,
          },
        });

        setSyncStatus({
          lastAutoSync: data.lastAutoSync,
          nextScheduledSync: data.nextScheduledSync,
          retryCount: data.retryCount || 0,
          recentErrors: data.recentErrors || [],
        });
      }

      // Update connection status
      if (connectionsResponse.status === "success") {
        setConnectionStatus(connectionsResponse.data);
      }
    } catch (err) {
      console.error("Error fetching auto-sync settings:", err);
      setError(err.message || "Failed to load auto-sync settings");
    } finally {
      setLoading(false);
    }
  }, []);

  // Update auto-sync settings
  const updateSettings = useCallback(
    async (newSettings) => {
      try {
        setSaving(true);
        setError(null);

        // Validate connections before enabling auto-sync
        if (newSettings.enabled && !connectionStatus.bothConnected) {
          throw new Error(
            "Both eBay and FreeAgent connections are required for auto-sync"
          );
        }

        const response = await autoSyncService.updateSettings(newSettings);

        if (response.status === "success") {
          // Update local state with response data
          const data = response.data;
          setSettings((prev) => ({
            ...prev,
            ...newSettings,
          }));

          setSyncStatus((prev) => ({
            ...prev,
            nextScheduledSync: data.nextScheduledSync,
          }));

          return response;
        } else {
          throw new Error(response.message || "Failed to update settings");
        }
      } catch (err) {
        console.error("Error updating auto-sync settings:", err);
        setError(err.message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [connectionStatus.bothConnected]
  );

  // Test auto-sync functionality
  const testAutoSync = useCallback(async () => {
    try {
      setTesting(true);
      setError(null);

      // Validate connections before testing
      if (!connectionStatus.bothConnected) {
        throw new Error(
          "Both eBay and FreeAgent connections are required to test auto-sync"
        );
      }

      const response = await autoSyncService.testSync();

      if (response.status === "success" || response.status === "error") {
        return response;
      } else {
        throw new Error("Unexpected response from auto-sync test");
      }
    } catch (err) {
      console.error("Error testing auto-sync:", err);
      setError(err.message);
      throw err;
    } finally {
      setTesting(false);
    }
  }, [connectionStatus.bothConnected]);

  // Check if auto-sync can be enabled
  const canEnableAutoSync = useCallback(() => {
    return connectionStatus.bothConnected;
  }, [connectionStatus.bothConnected]);

  // Get human-readable status message
  const getStatusMessage = useCallback(() => {
    if (!settings.enabled) {
      return "Auto-sync is disabled";
    }

    if (!canEnableAutoSync()) {
      return "Connections required for auto-sync";
    }

    if (syncStatus.retryCount >= 3) {
      return "Auto-sync paused due to repeated failures";
    }

    if (settings.frequency === "manual") {
      return "Auto-sync set to manual only";
    }

    if (syncStatus.nextScheduledSync) {
      const nextSync = new Date(syncStatus.nextScheduledSync);
      const now = new Date();

      if (nextSync <= now) {
        return "Ready for sync";
      }

      return `Next sync: ${nextSync.toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      })}`;
    }

    return "Auto-sync configured";
  }, [
    settings.enabled,
    settings.frequency,
    syncStatus.nextScheduledSync,
    syncStatus.retryCount,
    canEnableAutoSync,
  ]);

  // Initialize on mount
  useEffect(() => {
    fetchAutoSyncSettings();
  }, [fetchAutoSyncSettings]);

  // Return hook interface
  return {
    // State
    settings,
    syncStatus,
    connectionStatus,
    loading,
    saving,
    testing,
    error,

    // Actions
    updateSettings,
    testAutoSync,
    refetch: fetchAutoSyncSettings,

    // Computed values
    canEnableAutoSync: canEnableAutoSync(),
    statusMessage: getStatusMessage(),

    // Helper functions
    clearError: () => setError(null),
  };
};

export default useAutoSync;
