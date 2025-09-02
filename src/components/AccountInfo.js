// Updated AccountInfo.js with better error handling and debugging

import React, { useState, useEffect } from 'react';

const AccountInfo = () => {
  const [accountInfo, setAccountInfo] = useState({
    app: null,
    ebay: null,
    freeagent: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    fetchAccountInfo();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchAccountInfo = async () => {
    try {
      console.log('🔍 Fetching account info...');
      
      // Try to fetch basic user info first to see if auth works
      let appUserInfo = null;
      
      // Method 1: Try getting user info from /api/auth/me (more likely to exist)
      try {
        const userResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/me`, {
          headers: getAuthHeaders(),
          credentials: 'include',
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          appUserInfo = {
            userEmail: userData.data?.user?.email || userData.user?.email || 'Unknown',
            userFullName: `${userData.data?.user?.firstName || userData.user?.firstName || ''} ${userData.data?.user?.lastName || userData.user?.lastName || ''}`.trim() || 'Unknown User'
          };
          console.log('✅ Got user info:', appUserInfo);
        }
      } catch (e) {
        console.log('⚠️ Could not fetch user info from /api/auth/me:', e.message);
      }

      // Method 2: Try the new account-info endpoints (may not exist yet)
      let ebayAccountInfo = null;
      let freeagentAccountInfo = null;

      try {
        const ebayResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/ebay/account-info`, {
          headers: getAuthHeaders(),
          credentials: 'include',
        });
        
        if (ebayResponse.ok) {
          const ebayData = await ebayResponse.json();
          ebayAccountInfo = ebayData.data?.ebay;
          if (!appUserInfo && ebayData.data?.app) {
            appUserInfo = ebayData.data.app;
          }
          console.log('✅ Got eBay account info:', ebayAccountInfo);
        } else {
          console.log('⚠️ eBay account-info endpoint not available (404/405 expected)');
        }
      } catch (e) {
        console.log('⚠️ Could not fetch eBay account info:', e.message);
      }

      try {
        const freeagentResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/freeagent/account-info`, {
          headers: getAuthHeaders(),
          credentials: 'include',
        });
        
        if (freeagentResponse.ok) {
          const freeagentData = await freeagentResponse.json();
          freeagentAccountInfo = freeagentData.data?.freeagent;
          if (!appUserInfo && freeagentData.data?.app) {
            appUserInfo = freeagentData.data.app;
          }
          console.log('✅ Got FreeAgent account info:', freeagentAccountInfo);
        } else {
          console.log('⚠️ FreeAgent account-info endpoint not available (404/405 expected)');
        }
      } catch (e) {
        console.log('⚠️ Could not fetch FreeAgent account info:', e.message);
      }

      // Method 3: Fallback to existing connection-status endpoints
      if (!ebayAccountInfo) {
        try {
          const ebayStatus = await fetch(`${process.env.REACT_APP_API_URL}/api/ebay/connection-status`, {
            headers: getAuthHeaders(),
            credentials: 'include',
          });
          
          if (ebayStatus.ok) {
            const ebayData = await ebayStatus.json();
            if (ebayData.data?.isConnected || ebayData.isConnected) {
              ebayAccountInfo = {
                userId: ebayData.data?.userId || ebayData.userId || 'Unknown',
                environment: ebayData.data?.environment || ebayData.environment || 'production',
                connectedAt: ebayData.data?.connectedAt || ebayData.connectedAt || new Date(),
                username: null // Not available from connection-status
              };
              console.log('✅ Got eBay connection status:', ebayAccountInfo);
            }
          }
        } catch (e) {
          console.log('⚠️ Could not fetch eBay connection status:', e.message);
        }
      }

      if (!freeagentAccountInfo) {
        try {
          const freeagentStatus = await fetch(`${process.env.REACT_APP_API_URL}/api/freeagent/connection-status`, {
            headers: getAuthHeaders(),
            credentials: 'include',
          });
          
          if (freeagentStatus.ok) {
            const freeagentData = await freeagentStatus.json();
            if (freeagentData.data?.isConnected || freeagentData.isConnected) {
              freeagentAccountInfo = {
                companyId: freeagentData.data?.companyId || freeagentData.companyId || 'Unknown',
                connectedAt: freeagentData.data?.connectedAt || freeagentData.connectedAt || new Date(),
                environment: 'production'
              };
              console.log('✅ Got FreeAgent connection status:', freeagentAccountInfo);
            }
          }
        } catch (e) {
          console.log('⚠️ Could not fetch FreeAgent connection status:', e.message);
        }
      }

      // Update state with whatever we found
      setAccountInfo({
        app: appUserInfo,
        ebay: ebayAccountInfo,
        freeagent: freeagentAccountInfo,
        loading: false,
        error: null
      });

      console.log('🎯 Final account info state:', {
        app: appUserInfo,
        ebay: ebayAccountInfo,
        freeagent: freeagentAccountInfo
      });

      console.log('🧪 Connection test:', {
        ebayConnected: !!(ebayAccountInfo && (ebayAccountInfo.userId || ebayAccountInfo.environment)),
        freeagentConnected: !!(freeagentAccountInfo && (freeagentAccountInfo.companyId || freeagentAccountInfo.environment))
      });

    } catch (error) {
      console.error('❌ Error fetching account info:', error);
      setAccountInfo(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load account information: ' + error.message
      }));
    }
  };

  if (accountInfo.loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (accountInfo.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <p className="text-red-600 text-sm">{accountInfo.error}</p>
        <button 
          onClick={fetchAccountInfo}
          className="mt-2 text-sm text-red-800 hover:text-red-600 font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Connected Accounts
      </h3>
      
      <div className="space-y-4">
        {/* App User Info */}
        {accountInfo.app && (
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
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
            <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            <span className="font-medium text-yellow-900">eBay Account</span>
          </div>
          
          {accountInfo.ebay && (accountInfo.ebay.userId || accountInfo.ebay.environment) ? (
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
                <strong>Connected:</strong> {new Date(accountInfo.ebay.connectedAt).toLocaleDateString()}
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
            <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium text-green-900">FreeAgent Account</span>
          </div>
          
          {accountInfo.freeagent && (accountInfo.freeagent.companyId || accountInfo.freeagent.environment) ? (
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
                <strong>Connected:</strong> {new Date(accountInfo.freeagent.connectedAt).toLocaleDateString()}
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
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              accountInfo.ebay && (accountInfo.ebay.userId || accountInfo.ebay.environment) &&
              accountInfo.freeagent && (accountInfo.freeagent.companyId || accountInfo.freeagent.environment)
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {accountInfo.ebay && (accountInfo.ebay.userId || accountInfo.ebay.environment) &&
               accountInfo.freeagent && (accountInfo.freeagent.companyId || accountInfo.freeagent.environment)
                ? 'Ready to Sync' 
                : 'Connect Both Accounts'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountInfo;