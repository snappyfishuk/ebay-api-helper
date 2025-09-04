// pages/Dashboard.js - Clean dashboard focused on overview
import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  RefreshCw,
  Zap,
  Settings,
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

const Dashboard = ({ user }) => {
  const [connections, setConnections] = useState({
    ebay: { isConnected: false },
    freeagent: { isConnected: false },
  });
  const [syncStats, setSyncStats] = useState(null);
  const [autoSyncStatus, setAutoSyncStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch connections
      const [ebayRes, freeagentRes, statsRes, autoSyncRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_URL}/api/ebay/connection-status`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }),
        fetch(
          `${process.env.REACT_APP_API_URL}/api/freeagent/connection-status`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        ),
        fetch(`${process.env.REACT_APP_API_URL}/api/users/sync-stats`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }),
        fetch(`${process.env.REACT_APP_API_URL}/api/autosync/settings`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }),
      ]);

      const [ebayData, freeagentData, statsData, autoSyncData] =
        await Promise.all([
          ebayRes.json(),
          freeagentRes.json(),
          statsRes.json(),
          autoSyncRes.json(),
        ]);

      setConnections({
        ebay: ebayData.data,
        freeagent: freeagentData.data,
      });

      if (statsRes.ok) setSyncStats(statsData.data);
      if (autoSyncRes.ok) setAutoSyncStatus(autoSyncData.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isSetupComplete =
    connections.ebay.isConnected && connections.freeagent.isConnected;
  const isAutoSyncActive =
    autoSyncStatus?.enabled && autoSyncStatus?.frequency !== "manual";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user.firstName}!
              </h1>
              <p className="text-gray-600 mt-1">
                Your eBay to FreeAgent sync dashboard
              </p>
            </div>

            {/* Overall Status */}
            <div
              className={`px-4 py-2 rounded-lg ${
                isSetupComplete
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              <div className="flex items-center">
                {isSetupComplete ? (
                  <CheckCircle className="h-5 w-5 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 mr-2" />
                )}
                {isSetupComplete ? "Ready to Sync" : "Setup Required"}
              </div>
            </div>
          </div>
        </div>

        {/* Setup Progress (if incomplete) */}
        {!isSetupComplete && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Setup Progress
            </h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <div
                  className={`h-3 w-3 rounded-full mr-3 ${
                    connections.ebay.isConnected
                      ? "bg-green-400"
                      : "bg-gray-300"
                  }`}
                ></div>
                <span className="text-sm">Connect eBay Account</span>
                {!connections.ebay.isConnected && (
                  <button className="ml-auto text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Connect Now
                  </button>
                )}
              </div>

              <div className="flex items-center">
                <div
                  className={`h-3 w-3 rounded-full mr-3 ${
                    connections.freeagent.isConnected
                      ? "bg-green-400"
                      : "bg-gray-300"
                  }`}
                ></div>
                <span className="text-sm">Connect FreeAgent Account</span>
                {!connections.freeagent.isConnected && (
                  <button className="ml-auto text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Connect Now
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        {syncStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Total Synced
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {syncStats.totalSynced}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <RefreshCw className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Last Sync</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {syncStats.lastSyncCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Success Rate
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {syncStats.successRate}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-8 w-8 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Last Sync</p>
                  <p className="text-sm font-bold text-gray-900">
                    {syncStats.lastSyncAt
                      ? new Date(syncStats.lastSyncAt).toLocaleDateString(
                          "en-GB"
                        )
                      : "Never"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Auto-Sync Status */}
        {autoSyncStatus && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Auto-Sync Status
              </h2>
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isAutoSyncActive
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {isAutoSyncActive ? "Active" : "Inactive"}
              </div>
            </div>

            {isAutoSyncActive ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Frequency</p>
                  <p className="font-semibold capitalize">
                    {autoSyncStatus.frequency}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Next Sync</p>
                  <p className="font-semibold">
                    {autoSyncStatus.nextScheduledSync
                      ? new Date(
                          autoSyncStatus.nextScheduledSync
                        ).toLocaleDateString("en-GB")
                      : "Not scheduled"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Lag Days</p>
                  <p className="font-semibold">{autoSyncStatus.lagDays} days</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-600 mb-4">
                  Set up automatic daily syncing
                </p>
                <NavLink
                  to="/auto-sync"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Configure Auto-Sync
                </NavLink>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <NavLink
              to="/sync"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="h-8 w-8 text-blue-600 mr-4" />
              <div>
                <h3 className="font-medium text-gray-900">Manual Sync</h3>
                <p className="text-sm text-gray-600">Run a one-time sync</p>
              </div>
            </NavLink>

            <NavLink
              to="/auto-sync"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Zap className="h-8 w-8 text-green-600 mr-4" />
              <div>
                <h3 className="font-medium text-gray-900">
                  Auto-Sync Settings
                </h3>
                <p className="text-sm text-gray-600">
                  Configure automatic sync
                </p>
              </div>
            </NavLink>

            <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <Settings className="h-8 w-8 text-purple-600 mr-4" />
              <div>
                <h3 className="font-medium text-gray-900">Settings</h3>
                <p className="text-sm text-gray-600">Manage preferences</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
