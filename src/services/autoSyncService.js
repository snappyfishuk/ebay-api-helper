// src/services/autoSyncService.js

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

class AutoSyncService {
  /**
   * Get current auto-sync settings for the user
   */
  async getSettings() {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${API_BASE}/autosync/settings`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Authentication failed. Please log in again.");
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          `Failed to fetch auto-sync settings: ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Update auto-sync settings
   */
  async updateSettings(settings) {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("No authentication token found");
    }

    // Validate required fields
    if (settings.enabled) {
      if (!settings.frequency || settings.frequency === "manual") {
        throw new Error(
          "Please select a sync frequency when enabling auto-sync"
        );
      }
      if (!settings.time) {
        throw new Error("Please select a sync time when enabling auto-sync");
      }
    }

    const response = await fetch(`${API_BASE}/autosync/settings`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Authentication failed. Please log in again.");
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || "Failed to update auto-sync settings"
      );
    }

    return response.json();
  }

  /**
   * Test auto-sync functionality manually
   */
  async testSync() {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${API_BASE}/autosync/test`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Authentication failed. Please log in again.");
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Auto-sync test failed");
    }

    return response.json();
  }

  /**
   * Get auto-sync history/statistics
   */
  async getSyncHistory() {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${API_BASE}/users/sync-stats`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Authentication failed. Please log in again.");
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch sync history");
    }

    return response.json();
  }

  /**
   * Get user connection status to validate if auto-sync can be enabled
   */
  async getConnectionStatus() {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${API_BASE}/users/connections`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Authentication failed. Please log in again.");
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch connection status");
    }

    return response.json();
  }
}

// Export singleton instance
export const autoSyncService = new AutoSyncService();
export default autoSyncService;
