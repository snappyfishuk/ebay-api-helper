// components/tabs/DashboardTab.tsx
import React from 'react';

interface DashboardTabProps {
  setupStatus: any;
  user: any;
  connections: any;
  freeagentConnection: any;
  ebayConnection: any;
  setActiveNav: (nav: string) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  setupStatus,
  user,
  connections,
  freeagentConnection,
  ebayConnection,
  setActiveNav
}) => {
  return (
    <div className="space-y-6">
      {/* Dashboard Overview */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {setupStatus.readyToSync ? 'Dashboard Overview' : 'Welcome to eBay API Helper'}
        </h3>
        <p className="text-gray-600 text-sm">
          {setupStatus.readyToSync 
            ? 'Monitor your eBay transaction syncing with FreeAgent' 
            : 'Complete the setup to start syncing eBay transactions'}
        </p>
      </div>

      {/* Setup Progress - Only if not ready */}
      {!setupStatus.readyToSync && (
        <div className="bg-white border rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Setup Progress</h4>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold ${
                connections.ebay.isConnected ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}>
                {connections.ebay.isConnected ? '✓' : '1'}
              </div>
              <div className="flex-1">
                <span className={connections.ebay.isConnected ? 'text-green-600 font-medium' : 'text-gray-600'}>
                  Connect eBay account
                </span>
              </div>
              {!connections.ebay.isConnected && (
                <button
                  onClick={ebayConnection.connect}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Connect
                </button>
              )}
            </div>
            
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold ${
                connections.freeagent.isConnected ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}>
                {connections.freeagent.isConnected ? '✓' : '2'}
              </div>
              <div className="flex-1">
                <span className={connections.freeagent.isConnected ? 'text-green-600 font-medium' : 'text-gray-600'}>
                  Connect FreeAgent account
                </span>
              </div>
              {!connections.freeagent.isConnected && (
                <button
                  onClick={freeagentConnection.connect}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  Connect
                </button>
              )}
            </div>
            
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold ${
                freeagentConnection.ebayAccountStatus.hasEbayAccount ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}>
                {freeagentConnection.ebayAccountStatus.hasEbayAccount ? '✓' : '3'}
              </div>
              <span className={freeagentConnection.ebayAccountStatus.hasEbayAccount ? 'text-green-600 font-medium' : 'text-gray-600'}>
                Set up eBay bank account in FreeAgent
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats - Only if ready to sync */}
      {setupStatus.readyToSync && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Syncs</p>
                <p className="text-2xl font-bold text-gray-900">{user?.autoSync?.stats?.totalAutoSyncs || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Successful</p>
                <p className="text-2xl font-bold text-gray-900">{user?.autoSync?.stats?.successfulAutoSyncs || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Auto-Sync</p>
                <p className="text-2xl font-bold text-gray-900">
                  {user?.autoSync?.enabled ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity or Quick Actions */}
      {setupStatus.readyToSync ? (
        <div className="bg-white border rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">Last Auto-Sync</p>
                <p className="text-xs text-gray-500">
                  {user?.autoSync?.lastAutoSync 
                    ? new Date(user.autoSync.lastAutoSync).toLocaleString('en-GB')
                    : 'Never run'}
                </p>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                user?.autoSync?.lastAutoSync ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {user?.autoSync?.lastAutoSync ? 'Complete' : 'Pending'}
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-900">Next Scheduled Sync</p>
                <p className="text-xs text-gray-500">
                  {user?.autoSync?.nextScheduledSync 
                    ? new Date(user.autoSync.nextScheduledSync).toLocaleString('en-GB')
                    : 'Not scheduled'}
                </p>
              </div>
              <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                {user?.autoSync?.enabled ? 'Scheduled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border rounded-lg p-6">
          <div className="text-center">
            <div className="text-4xl mb-4">🚀</div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Quick Actions</h4>
            <p className="text-gray-600 mb-6">
              Jump to different sections to set up or use the system.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => setActiveNav('autosync')}
                className="p-4 border border-blue-300 rounded-lg hover:bg-blue-50 text-left transition-colors"
              >
                <div className="font-medium text-blue-900">Configure Auto-Sync</div>
                <div className="text-sm text-blue-600">Set up automatic daily syncing</div>
              </button>
              <button 
                onClick={() => setActiveNav('manual')}
                className="p-4 border border-green-300 rounded-lg hover:bg-green-50 text-left transition-colors"
              >
                <div className="font-medium text-green-900">Manual Tools</div>
                <div className="text-sm text-green-600">One-time sync for specific dates</div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};