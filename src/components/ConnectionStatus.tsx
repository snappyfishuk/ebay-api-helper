// components/ConnectionStatus.js
import React from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const ConnectionStatus = ({ connections, setupStatus, onCheckStatus }) => {
  return (
    <div className="bg-blue-50 rounded-lg p-4 mb-6">
      <h4 className="font-medium text-blue-900 mb-3">Connection Status</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center">
          {connections.ebay.isConnected ? (
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500 mr-2" />
          )}
          <span className={connections.ebay.isConnected ? "text-green-700" : "text-red-700"}>
            eBay: {connections.ebay.isConnected ? "Connected" : "Not Connected"}
          </span>
        </div>
        
        <div className="flex items-center">
          {connections.freeagent.isConnected ? (
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500 mr-2" />
          )}
          <span className={connections.freeagent.isConnected ? "text-green-700" : "text-red-700"}>
            FreeAgent: {connections.freeagent.isConnected ? "Connected" : "Not Connected"}
          </span>
        </div>
      </div>
      
      {!setupStatus.canFetch && (
        <div className="mt-3 flex items-center text-yellow-700">
          <AlertCircle className="h-4 w-4 mr-2" />
          <span className="text-sm">Please connect both services to fetch transactions</span>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;






