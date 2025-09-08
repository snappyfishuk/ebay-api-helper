// components/AccountInfo.tsx - Updated with API Utils
import React, { useState, useEffect } from "react";
import { makeAuthenticatedRequest } from "../utils/apiUtils";

interface User {
  firstName: string;
  lastName: string;
  email: string;
}

interface EbayInfo {
  userId?: string;
  username?: string;
  environment: string;
  connectedAt?: string;
}

interface FreeagentInfo {
  companyId?: string;
  environment: string;
  connectedAt?: string;
}

interface TrialData {
  subscriptionStatus: string;
  trialEndsAt: string;
  isTrialActive: boolean;
  hasActiveSubscription: boolean;
  daysRemaining: number | null;
}

const AccountInfo: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [ebay, setEbay] = useState<EbayInfo | null>(null);
  const [freeagent, setFreeagent] = useState<FreeagentInfo | null>(null);
  const [trialData, setTrialData] = useState<TrialData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Get user info
      try {
        const userData = await makeAuthenticatedRequest('/auth/me');
        setUser(userData.data?.user || userData.user);
      } catch (e) {
        console.log("User info fetch failed:", e);
      }

      // Get trial/subscription info
      try {
        const trialResponse = await makeAuthenticatedRequest('/users/subscription');
        setTrialData(trialResponse.data);
      } catch (e) {
        console.log("Trial info fetch failed:", e);
      }

      // Get eBay info - try account-info first, fallback to connection-status
      let ebaySuccess = false;
      try {
        const ebayData = await makeAuthenticatedRequest('/ebay/account-info');
        setEbay(ebayData.data?.ebay);
        ebaySuccess = true;
      } catch (e) {
        // Try fallback
      }

      if (!ebaySuccess) {
        try {
          const ebayData = await makeAuthenticatedRequest('/ebay/connection-status');
          if (ebayData.data?.isConnected || ebayData.isConnected) {
            setEbay({
              userId: ebayData.data?.userId || "Connected",
              username: ebayData.data?.username || "eBay User",
              environment: ebayData.data?.environment || "production",
              connectedAt: ebayData.data?.connectedAt,
            });
          }
        } catch (e) {
          console.log("eBay connection status fetch failed:", e);
        }
      }

      // Get FreeAgent info
      try {
        const freeagentData = await makeAuthenticatedRequest('/freeagent/connection-status');
        if (freeagentData.data?.isConnected || freeagentData.isConnected) {
          setFreeagent({
            companyId: freeagentData.data?.companyId || "Connected",
            environment: "production",
            connectedAt: freeagentData.data?.connectedAt,
          });
        }
      } catch (e) {
        console.log("FreeAgent connection status fetch failed:", e);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format trial status text and colors
  const formatTimeRemaining = (daysRemaining: number) => {
    if (daysRemaining <= 0) return "Trial expired";
    if (daysRemaining === 1) return "1 day left";
    return `${daysRemaining} days left`;
  };

  const getTrialStatusColor = (daysRemaining: number | null, isActive: boolean) => {
    if (!isActive || !daysRemaining) return "red";
    if (daysRemaining <= 2) return "red";
    if (daysRemaining <= 5) return "yellow";
    return "green";
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
  const isFreeagentConnected = freeagent && (freeagent.companyId || freeagent.environment);

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

        {/* Trial Status - Only show for trial accounts */}
        {trialData && trialData.subscriptionStatus === 'trial' && (
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              getTrialStatusColor(trialData.daysRemaining, trialData.isTrialActive) === 'red' 
                ? 'bg-red-500'
                : getTrialStatusColor(trialData.daysRemaining, trialData.isTrialActive) === 'yellow'
                ? 'bg-yellow-500'
                : 'bg-green-500'
            }`}></div>
            <span className="text-sm font-medium text-gray-700">Trial:</span>
            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
              getTrialStatusColor(trialData.daysRemaining, trialData.isTrialActive) === 'red' 
                ? 'bg-red-100 text-red-800'
                : getTrialStatusColor(trialData.daysRemaining, trialData.isTrialActive) === 'yellow'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-green-100 text-green-800'
            }`}>
              {trialData.isTrialActive && trialData.daysRemaining
                ? formatTimeRemaining(trialData.daysRemaining)
                : "Expired"}
            </span>
          </div>
        )}

        {/* eBay Connection Status */}
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            isEbayConnected ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <span className="text-sm font-medium text-gray-700">eBay:</span>
          <span className={`px-2 py-1 text-xs rounded font-medium ${
            isEbayConnected 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {isEbayConnected 
              ? `Connected${ebay?.username ? ` (${ebay.username})` : ''}` 
              : 'Not Connected'}
          </span>
        </div>

        {/* FreeAgent Connection Status */}
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            isFreeagentConnected ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <span className="text-sm font-medium text-gray-700">FreeAgent:</span>
          <span className={`px-2 py-1 text-xs rounded font-medium ${
            isFreeagentConnected 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {isFreeagentConnected ? 'Connected' : 'Not Connected'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AccountInfo;