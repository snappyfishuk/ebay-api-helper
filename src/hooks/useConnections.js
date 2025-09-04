// hooks/useConnections.js
import { useState, useEffect } from "react";

export const useConnections = (user) => {
  const [connections, setConnections] = useState({
    ebay: { isConnected: false, environment: "production" },
    freeagent: { isConnected: false },
  });

  const [setupStatus, setSetupStatus] = useState({
    canFetch: false,
    canSync: false,
    ebayAccountReady: false,
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const checkConnectionStatus = async () => {
    if (!user) return;

    try {
      // Check eBay
      const ebayResponse = await fetch(
        `${process.env.REACT_APP_API_URL}/api/ebay/connection-status`,
        { headers: getAuthHeaders(), credentials: "include" }
      );

      if (ebayResponse.ok) {
        const ebayData = await ebayResponse.json();
        setConnections((prev) => ({
          ...prev,
          ebay: {
            isConnected: ebayData.data?.isConnected || ebayData.isConnected,
            environment: ebayData.data?.environment || "production",
          },
        }));
      }

      // Check FreeAgent
      const freeagentResponse = await fetch(
        `${process.env.REACT_APP_API_URL}/api/freeagent/connection-status`,
        { headers: getAuthHeaders(), credentials: "include" }
      );

      if (freeagentResponse.ok) {
        const freeagentData = await freeagentResponse.json();
        setConnections((prev) => ({
          ...prev,
          freeagent: {
            isConnected:
              freeagentData.data?.isConnected || freeagentData.isConnected,
          },
        }));
      }
    } catch (error) {
      console.error("Error checking connection status:", error);
    }
  };

  useEffect(() => {
    checkConnectionStatus();
  }, [user]);

  useEffect(() => {
    setSetupStatus({
      canFetch: connections.ebay.isConnected,
      canSync:
        connections.ebay.isConnected && connections.freeagent.isConnected,
      ebayAccountReady: connections.freeagent.isConnected, // Simplified for now
    });
  }, [connections]);

  return { connections, setupStatus, checkConnectionStatus };
};


