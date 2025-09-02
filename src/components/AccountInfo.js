// Simplified AccountInfo.js - Direct approach
import React, { useState, useEffect } from 'react';

const AccountInfo = () => {
  const [user, setUser] = useState(null);
  const [ebay, setEbay] = useState(null);
  const [freeagent, setFreeagent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchData = async () => {
    try {
      // Get user info
      const userRes = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/me`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.data?.user || userData.user);
      }

      // Get eBay info - try account-info first, fallback to connection-status
      let ebaySuccess = false;
      try {
        const ebayRes = await fetch(`${process.env.REACT_APP_API_URL}/api/ebay/account-info`, {
          headers: getAuthHeaders(),
          credentials: 'include',
        });
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
          const ebayRes = await fetch(`${process.env.REACT_APP_API_URL}/api/ebay/connection-status`, {
            headers: getAuthHeaders(),
            credentials: 'include',
          });
          if (ebayRes.ok) {
            const ebayData = await ebayRes.json();
            if (ebayData.data?.isConnected || ebayData.isConnected) {
              setEbay({
                userId: ebayData.data?.userId || ebayData.userId,
                environment: ebayData.data?.environment || ebayData.environment,
                connectedAt: ebayData.data?.connectedAt || ebayData.connectedAt
              });
            }
          }
        } catch (e) {
          console.log('eBay connection-status failed:', e);
        }
      }

      // Get FreeAgent info - try account-info first, fallback to connection-status
      let freeagentSuccess = false;
      try {
        const faRes = await fetch(`${process.env.REACT_APP_API_URL}/api/freeagent/account-info`, {
          headers: getAuthHeaders(),
          credentials: 'include',
        });
        if (faRes.ok) {
          const faData = await faRes.json();
          setFreeagent(faData.data?.freeagent);
          freeagentSuccess = true;
        }
      } catch (e) {
        console.log('FreeAgent account-info failed, trying fallback...');
      }
      
      // Always try fallback if account-info didn't work
      if (!freeagentSuccess) {
        try {
          const faRes = await fetch(`${process.env.REACT_APP_API_URL}/api/freeagent/connection-status`, {
            headers: getAuthHeaders(),
            credentials: 'include',
          });
          if (faRes.ok) {
            const faData = await faRes.json();
            if (faData.data?.isConnected || faData.isConnected) {
              setFreeagent({
                companyId: faData.data?.companyId || faData.companyId,
                connectedAt: faData.data?.connectedAt || faData.connectedAt,
                environment: 'production'
              });
            }
          }
        } catch (e) {
          console.log('FreeAgent connection-status also failed:', e);
        }
      }

    } catch (error) {
      console.error('Error fetching account data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  // Helper functions
  const isEbayConnected = ebay && (ebay.userId || ebay.environment);
  const isFreeagentConnected = freeagent && (freeagent.companyId || freeagent.environment);
  const isSyncReady = isEbayConnected && isFreeagentConnected;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Connected Accounts
      </h3>
      
      <div className="space-y-4">
        {/* User Info */}
        {user && (
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              <span className="font-medium text-blue-900">Your Account</span>
            </div>
            <p className="text-blue-800 text-sm">
              <strong>{user.firstName} {user.lastName}</strong>
            </p>
            <p className="text-blue-600 text-sm">{user.email}</p>
          </div>
        )}

        {/* eBay Account */}
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            <span className="font-medium text-yellow-900">eBay Account</span>
          </div>
          
          {isEbayConnected ? (
            <div className="space-y-1 text-sm">
              <p className="text-yellow-800">
                <strong>Status:</strong> 
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                  Connected
                </span>
              </p>
              {ebay.username && (
                <p className="text-yellow-700">
                  <strong>Username:</strong> {ebay.username}
                </p>
              )}
              <p className="text-yellow-700">
                <strong>Environment:</strong> {ebay.environment}
              </p>
              {ebay.connectedAt && (
                <p className="text-yellow-700">
                  <strong>Connected:</strong> {new Date(ebay.connectedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          ) : (
            <p className="text-yellow-600 text-sm">
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                Not Connected
              </span>
            </p>
          )}
        </div>

        {/* FreeAgent Account */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium text-green-900">FreeAgent Account</span>
          </div>
          
          {isFreeagentConnected ? (
            <div className="space-y-1 text-sm">
              <p className="text-green-800">
                <strong>Status:</strong>
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                  Connected
                </span>
              </p>
              <p className="text-green-700">
                <strong>Company ID:</strong> {freeagent.companyId}
              </p>
              {freeagent.connectedAt && (
                <p className="text-green-700">
                  <strong>Connected:</strong> {new Date(freeagent.connectedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          ) : (
            <p className="text-green-600 text-sm">
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                Not Connected
              </span>
            </p>
          )}
        </div>

        {/* Sync Status */}
        <div className="border-t pt-4 mt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Sync Ready:</span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              isSyncReady
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {isSyncReady ? 'Ready to Sync' : 'Connect Both Accounts'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountInfo;