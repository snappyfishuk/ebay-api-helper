// src/pages/AutoSync.js
// Create this file in your src/pages/ directory

import React from "react";
import AutoSyncSettings from "../components/sync/AutoSyncSettings";

const AutoSync = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                  Auto-Sync Settings
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Automatically sync your eBay transactions to FreeAgent daily,
                  just like Amazon integration
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <AutoSyncSettings />
      </main>
    </div>
  );
};

export default AutoSync;
