// components/tabs/AutoSyncTab.tsx - Complete Auto-Sync Management
import React, { useState } from 'react';
import {
  Connections,
  SetupStatus,
  EbayAccountStatus,
  User,
} from '../../types';

interface AutoSyncTabProps {
  connections: Connections;
  setupStatus: SetupStatus;
  ebayAccountStatus: EbayAccountStatus;
  user: User;
  isLoading: boolean;
}

export const AutoSyncTab: React.FC<AutoSyncTabProps> = ({
  connections,
  setupStatus,
  ebayAccountStatus,
  user,
  isLoading,
}) => {
  const [saving, setSaving] = useState(false);

  // Extract auto-sync data from user
  const autoSyncEnabled = user?.autoSync?.enabled || false;
  const nextSync = user?.autoSync?.nextScheduledSync;
  const lastSync = user?.autoSync?.lastAutoSync;
  const totalAutoSyncs = user?.autoSync?.stats?.totalAutoSyncs || 0;
  const successfulSyncs = user?.autoSync?.stats?.successfulAutoSyncs || 0;
  const failedSyncs = user?.autoSync?.stats?.failedAutoSyncs || 0;

  const handleToggleAutoSync = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/users/auto-sync`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            enabled: !autoSyncEnabled
          })
        }
      );
      
      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Auto-sync toggle error:', error);
    } finally {
      setSaving(false);
    }
  };

  const testAutoSync = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/users/test-auto-sync`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );
      
      if (response.ok) {
        alert('Test sync initiated! Check the sync history below for results.');
      }
    } catch (error) {
      console.error('Test sync error:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Auto-Sync Configuration */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-purple-800 mb-4">
          Auto-Sync Configuration
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Main Toggle */}
          <div className="bg-white border border-purple-300 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-purple-900">Enable Auto-Sync</h4>
              <div className="flex items-center">
                <button
                  onClick={handleToggleAutoSync}
                  disabled={!setupStatus.readyToSync || saving}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                    autoSyncEnabled ? 'bg-purple-600' : 'bg-gray-200'
                  } ${!setupStatus.readyToSync ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autoSyncEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center text-purple-700">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span>Daily sync at 2:00 AM UK time</span>
              </div>
              <div className="flex items-center text-purple-700">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414L2.586 7l3.707-3.707a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>1-2 day lag for eBay processing</span>
              </div>
              <div className="flex items-center text-purple-700">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Automatic retry on failures</span>
              </div>
            </div>

            {!setupStatus.readyToSync && (
              <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                <p className="text-yellow-800 text-sm font-medium">
                  Complete setup first to enable auto-sync
                </p>
              </div>
            )}
          </div>

          {/* Schedule Info */}
          <div className="bg-white border border-purple-300 rounded-lg p-6">
            <h4 className="text-lg font-bold text-purple-900 mb-4">Schedule Information</h4>
            
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-purple-800 mb-1">Next Sync</div>
                <div className="text-gray-900">
                  {autoSyncEnabled && nextSync ? (
                    new Date(nextSync).toLocaleString('en-GB', {
                      timeZone: 'Europe/London',
                      dateStyle: 'full',
                      timeStyle: 'short'
                    })
                  ) : (
                    <span className="text-gray-500">Not scheduled</span>
                  )}
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-purple-800 mb-1">Last Sync</div>
                <div className="text-gray-900">
                  {lastSync ? (
                    new Date(lastSync).toLocaleString('en-GB', {
                      timeZone: 'Europe/London',
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })
                  ) : (
                    <span className="text-gray-500">Never</span>
                  )}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-purple-800 mb-1">Status</div>
                <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  autoSyncEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {autoSyncEnabled ? 'Active' : 'Disabled'}
                </div>
              </div>
            </div>

            {setupStatus.readyToSync && (
              <button
                onClick={testAutoSync}
                disabled={saving}
                className="mt-4 w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {saving ? 'Testing...' : 'Test Sync Now'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-gradient-to-br from-blue-50 to-green-50 border-2 border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Auto-Sync Statistics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-300 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{totalAutoSyncs}</div>
            <div className="text-blue-800 text-sm font-medium">Total Auto-Syncs</div>
          </div>
          <div className="bg-white border border-gray-300 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{successfulSyncs}</div>
            <div className="text-green-800 text-sm font-medium">Successful</div>
          </div>
          <div className="bg-white border border-gray-300 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{failedSyncs}</div>
            <div className="text-red-800 text-sm font-medium">Failed</div>
          </div>
          <div className="bg-white border border-gray-300 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {totalAutoSyncs > 0 ? Math.round((successfulSyncs / totalAutoSyncs) * 100) : 0}%
            </div>
            <div className="text-purple-800 text-sm font-medium">Success Rate</div>
          </div>
        </div>
      </div>

      {/* Sync History */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Auto-Sync History</h3>
        
        {user?.syncStats?.syncHistory && user.syncStats.syncHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Processed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {user.syncStats.syncHistory
                  .filter(sync => sync.syncType === 'auto')
                  .slice(0, 10)
                  .map((sync, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(sync.timestamp).toLocaleString('en-GB', {
                        timeZone: 'Europe/London',
                        dateStyle: 'short',
                        timeStyle: 'short'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                        Auto
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sync.transactionsProcessed || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sync.transactionsCreated || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sync.duration ? `${Math.round(sync.duration / 1000)}s` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        (sync.transactionsFailed || 0) === 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {(sync.transactionsFailed || 0) === 0 ? 'Success' : 'Failed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">⏰</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Auto-Sync History</h4>
            <p className="text-gray-600">
              {autoSyncEnabled 
                ? 'Auto-sync is enabled but no syncs have run yet.'
                : 'Enable auto-sync to see sync history here.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-4">How Auto-Sync Works</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-bold text-blue-800 mb-2">Schedule</h4>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Runs daily at 2:00 AM UK time</li>
              <li>• Simplified fixed schedule (no user customization)</li>
              <li>• Optimized for UK business hours</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-blue-800 mb-2">Data Processing</h4>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• 1-2 day lag to match eBay's processing time</li>
              <li>• Automatic retry on temporary failures</li>
              <li>• Safe duplicate transaction prevention</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-blue-800 mb-2">Notifications</h4>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Email alerts on sync failures</li>
              <li>• Success notifications (optional)</li>
              <li>• Weekly summary reports</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-blue-800 mb-2">Safety Features</h4>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Never deletes existing transactions</li>
              <li>• Dedicated eBay account isolation</li>
              <li>• Manual override always available</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};