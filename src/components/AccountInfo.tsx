// Compact AccountInfo.js with eBay colors and horizontal layout
import React, { useState, useEffect } from "react";

const AccountInfo = () => {
  const [user, setUser] = useState(null);
  const [ebay, setEbay] = useState(null);
  const [freeagent, setFreeagent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchData = async () => {
    try {
      // Get user info
      const userRes = await fetch(
        `${process.env.REACT_APP_API_URL}/api/auth/me`,
        {
          headers: getAuthHeaders(),
          credentials: "include",
        }
      );
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.data?.user || userData.user);
      }

      // Get eBay info - try account-info first, fallback to connection-status
      let ebaySuccess = false;
      try {
        const ebayRes = await fetch(
          `${process.env.REACT_APP_API_URL}/api/ebay/account-info`,
          {
            headers: getAuthHeaders(),
            credentials: "include",
          }
        );
        if (ebayRes.ok) {
          const ebayData = await ebayRes.json();
          setEbay(ebayData.data?.ebay);
          ebaySuccess = true;
        }
      } catch (e) {
        // Network error
      }

      if (!ebaySuccess) {
        try {
          const ebayRes = await fetch(
            `${process.env.REACT_APP_API_URL}/api/ebay/connection-status`,
            {
              headers: getAuthHeaders(),
              credentials: "include",
            }
          );
          if (ebayRes.ok) {
            const ebayData = await ebayRes.json();
            if (ebayData.data?.isConnected || ebayData.isConnected) {
              setEbay({
                userId: ebayData.data?.userId || ebayData.userId,
                environment: ebayData.data?.environment || ebayData.environment,
                connectedAt: ebayData.data?.connectedAt || ebayData.connectedAt,
              });
            }
          }
        } catch (e) {
          console.log("eBay connection-status failed:", e);
        }
      }

      // Get FreeAgent info - try account-info first, fallback to connection-status
      let freeagentSuccess = false;
      try {
        const faRes = await fetch(
          `${process.env.REACT_APP_API_URL}/api/freeagent/account-info`,
          {
            headers: getAuthHeaders(),
            credentials: "include",
          }
        );
        if (faRes.ok) {
          const faData = await faRes.json();
          setFreeagent(faData.data?.freeagent);
          freeagentSuccess = true;
        }
      } catch (e) {
        console.log("FreeAgent account-info failed, trying fallback...");
      }

      // Always try fallback if account-info didn't work
      if (!freeagentSuccess) {
        try {
          const faRes = await fetch(
            `${process.env.REACT_APP_API_URL}/api/freeagent/connection-status`,
            {
              headers: getAuthHeaders(),
              credentials: "include",
            }
          );
          if (faRes.ok) {
            const faData = await faRes.json();
            if (faData.data?.isConnected || faData.isConnected) {
              setFreeagent({
                companyId: faData.data?.companyId || faData.companyId,
                connectedAt: faData.data?.connectedAt || faData.connectedAt,
                environment: "production",
              });
            }
          }
        } catch (e) {
          console.log("FreeAgent connection-status also failed:", e);
        }
      }
    } catch (error) {
      console.error("Error fetching account data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="animate-pulse flex items-center space-x-4">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    );
  }

  // Helper functions
  const isEbayConnected = ebay && (ebay.userId || ebay.environment);
  const isFreeagentConnected =
    freeagent && (freeagent.companyId || freeagent.environment);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      <div className="flex flex-wrap items-center gap-6">
        {/* User Account - Compact */}
        {user && (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">
              {user.firstName} {user.lastName}
            </span>
            <span className="text-xs text-gray-500">({user.email})</span>
          </div>
        )}

        {/* eBay Status - eBay Colors */}
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isEbayConnected ? "bg-red-500" : "bg-gray-300"
            }`}
          ></div>
          <span className="text-sm font-medium text-gray-700">eBay:</span>
          {isEbayConnected ? (
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-red-600">
                {ebay.username || "Connected"}
              </span>
              <span className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded-full">
                {ebay.environment}
              </span>
            </div>
          ) : (
            <span className="text-sm text-gray-500">Not Connected</span>
          )}
        </div>

        {/* FreeAgent Status - FreeAgent Green */}
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isFreeagentConnected ? "bg-green-600" : "bg-gray-300"
            }`}
          ></div>
          <span className="text-sm font-medium text-gray-700">FreeAgent:</span>
          {isFreeagentConnected ? (
            <span className="text-sm font-medium text-green-600">
              Connected
            </span>
          ) : (
            <span className="text-sm text-gray-500">Not Connected</span>
          )}
        </div>

        {/* Sync Status - Compact */}
        <div className="ml-auto">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              isEbayConnected && isFreeagentConnected
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-yellow-50 text-yellow-700 border border-yellow-200"
            }`}
          >
            {isEbayConnected && isFreeagentConnected
              ? "Ready to Sync"
              : "Setup Required"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AccountInfo;
