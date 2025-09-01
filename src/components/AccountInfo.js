// Create a new component: src/components/AccountInfo.js

import React, { useState, useEffect } from "react";

const AccountInfo = () => {
  const [accountInfo, setAccountInfo] = useState({
    app: null,
    ebay: null,
    freeagent: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    fetchAccountInfo();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchAccountInfo = async () => {
    try {
      const promises = [];

      // Fetch eBay account info if connected
      promises.push(
        fetch(`${process.env.REACT_APP_API_URL}/api/ebay/account-info`, {
          headers: getAuthHeaders(),
          credentials: "include",
        }).then((res) => (res.ok ? res.json() : null))
      );

      // Fetch FreeAgent account info if connected
      promises.push(
        fetch(`${process.env.REACT_APP_API_URL}/api/freeagent/account-info`, {
          headers: getAuthHeaders(),
          credentials: "include",
        }).then((res) => (res.ok ? res.json() : null))
      );

      const [ebayResult, freeagentResult] = await Promise.all(promises);

      setAccountInfo({
        app: ebayResult?.data?.app || freeagentResult?.data?.app,
        ebay: ebayResult?.data?.ebay || null,
        freeagent: freeagentResult?.data?.freeagent || null,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error("Error fetching account info:", error);
      setAccountInfo((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to load account information",
      }));
    }
  };

  if (accountInfo.loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (accountInfo.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{accountInfo.error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🔗 Connected Accounts
      </h3>

      <div className="space-y-4">
        {/* App User Info */}
        {accountInfo.app && (
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <svg
                className="w-5 h-5 text-blue-600 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium text-blue-900">Your Account</span>
            </div>
            <p className="text-blue-800 text-sm">
              <strong>{accountInfo.app.userFullName}</strong>
            </p>
            <p className="text-blue-600 text-sm">{accountInfo.app.userEmail}</p>
          </div>
        )}

        {/* eBay Account Info */}
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <svg
              className="w-5 h-5 text-yellow-600 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium text-yellow-900">eBay Account</span>
          </div>

          {accountInfo.ebay ? (
            <div className="space-y-1 text-sm">
              <p className="text-yellow-800">
                <strong>Status:</strong>
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                  Connected
                </span>
              </p>
              {accountInfo.ebay.username && (
                <p className="text-yellow-700">
                  <strong>Username:</strong> {accountInfo.ebay.username}
                </p>
              )}
              <p className="text-yellow-700">
                <strong>User ID:</strong> {accountInfo.ebay.userId}
              </p>
              <p className="text-yellow-700">
                <strong>Environment:</strong> {accountInfo.ebay.environment}
              </p>
              <p className="text-yellow-700">
                <strong>Connected:</strong>{" "}
                {new Date(accountInfo.ebay.connectedAt).toLocaleDateString()}
              </p>
            </div>
          ) : (
            <p className="text-yellow-600 text-sm">
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                Not Connected
              </span>
            </p>
          )}
        </div>

        {/* FreeAgent Account Info */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <svg
              className="w-5 h-5 text-green-600 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium text-green-900">
              FreeAgent Account
            </span>
          </div>

          {accountInfo.freeagent ? (
            <div className="space-y-1 text-sm">
              <p className="text-green-800">
                <strong>Status:</strong>
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                  Connected
                </span>
              </p>
              <p className="text-green-700">
                <strong>Company ID:</strong> {accountInfo.freeagent.companyId}
              </p>
              <p className="text-green-700">
                <strong>Connected:</strong>{" "}
                {new Date(
                  accountInfo.freeagent.connectedAt
                ).toLocaleDateString()}
              </p>
            </div>
          ) : (
            <p className="text-green-600 text-sm">
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                Not Connected
              </span>
            </p>
          )}
        </div>

        {/* Connection Status Summary */}
        <div className="border-t pt-4 mt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Sync Ready:</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                accountInfo.ebay && accountInfo.freeagent
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {accountInfo.ebay && accountInfo.freeagent
                ? "✅ Ready to Sync"
                : "⚠️ Connect Both Accounts"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountInfo;
