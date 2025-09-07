// components/tabs/SetupTab.tsx - Enhanced with Brand Colors
import React, { useState } from 'react';
import {
  Connections,
  EbayAccountStatus,
  FreeAgentBankAccount,
  SetupStatus,
  User,
} from '../../types';

interface SetupTabProps {
  connections: Connections;
  ebayAccountStatus: EbayAccountStatus;
  availableEbayAccounts: FreeAgentBankAccount[];
  setupStatus: SetupStatus;
  user: User;
  onConnectEbay: () => Promise<void>;
  onDisconnectEbay: () => Promise<void>;
  onConnectFreeAgent: () => Promise<void>;
  onDisconnectFreeAgent: () => Promise<void>;
  onCreateEbayAccount: () => Promise<void>;
  onSelectEbayAccount: (accountUrl: string) => Promise<void>;
  isLoading: boolean;
}

export const SetupTab: React.FC<SetupTabProps> = ({
  connections,
  ebayAccountStatus,
  availableEbayAccounts,
  setupStatus,
  user,
  onConnectEbay,
  onDisconnectEbay,
  onConnectFreeAgent,
  onDisconnectFreeAgent,
  onCreateEbayAccount,
  onSelectEbayAccount,
  isLoading,
}) => {
  return (
    <div className="space-y-8">
      {/* eBay Integration Section - eBay Brand Colors */}
      <div className="bg-gradient-to-br from-blue-50 to-red-50 border-2 border-blue-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-blue-800">
            eBay Integration
          </h3>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              connections.ebay.isConnected
                ? "bg-blue-100 text-blue-800 border border-blue-300"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {connections.ebay.isConnected ? "Connected" : "Not Connected"}
          </div>
        </div>

        {connections.ebay.isConnected ? (
          <div className="space-y-4">
            <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 text-blue-600 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-blue-900 font-bold">
                    eBay Connected Successfully
                  </p>
                  <p className="text-blue-700 text-sm">
                    Environment: {connections.ebay.environment} | Enhanced
                    descriptions active
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={onDisconnectEbay}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
            >
              Disconnect eBay
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
              <h4 className="font-bold text-blue-900 mb-2">
                Connect Your eBay Account
              </h4>
              <p className="text-blue-800 text-sm mb-4">
                Securely connect your eBay account to fetch transaction data
                with enhanced descriptions.
              </p>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Enhanced transaction descriptions using eBay's rich data</li>
                <li>• Uses transaction memos and reference information</li>
                <li>• Production eBay API integration with RFC 9421 signatures</li>
                <li>• Individual account isolation - your data stays private</li>
              </ul>
            </div>
            <button
              onClick={onConnectEbay}
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isLoading ? "Connecting..." : "Connect to eBay"}
            </button>
          </div>
        )}
      </div>

      {/* FreeAgent Integration Section - FreeAgent Brand Colors */}
      <StreamlinedFreeAgentSection
        connections={connections}
        ebayAccountStatus={ebayAccountStatus}
        availableEbayAccounts={availableEbayAccounts}
        onConnectFreeAgent={onConnectFreeAgent}
        onDisconnectFreeAgent={onDisconnectFreeAgent}
        onCreateEbayAccount={onCreateEbayAccount}
        onSelectEbayAccount={onSelectEbayAccount}
        isLoading={isLoading}
      />

      {/* Setup Progress */}
      {!setupStatus.readyToSync && <SetupProgress setupStatus={setupStatus} />}
    </div>
  );
};

// Enhanced FreeAgent Section with Brand Colors
const StreamlinedFreeAgentSection: React.FC<{
  connections: Connections;
  ebayAccountStatus: EbayAccountStatus;
  availableEbayAccounts: FreeAgentBankAccount[];
  onConnectFreeAgent: () => Promise<void>;
  onDisconnectFreeAgent: () => Promise<void>;
  onCreateEbayAccount: () => Promise<void>;
  onSelectEbayAccount: (accountUrl: string) => Promise<void>;
  isLoading: boolean;
}> = ({
  connections,
  ebayAccountStatus,
  availableEbayAccounts,
  onConnectFreeAgent,
  onDisconnectFreeAgent,
  onCreateEbayAccount,
  onSelectEbayAccount,
  isLoading,
}) => {
  const [creatingAccount, setCreatingAccount] = useState(false);

  const needsAccountSelection =
    !ebayAccountStatus.hasEbayAccount && availableEbayAccounts.length > 0;

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-green-800">
          FreeAgent Integration
        </h3>
        <div
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            connections.freeagent.isConnected
              ? "bg-green-100 text-green-800 border border-green-300"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {connections.freeagent.isConnected ? "Connected" : "Not Connected"}
        </div>
      </div>

      {connections.freeagent.isConnected ? (
        <div className="space-y-4">
          {/* Success Message */}
          <div className="bg-green-100 border border-green-300 rounded-lg p-4">
            <div className="flex items-center">
              <svg
                className="h-5 w-5 text-green-600 mr-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-green-900 font-bold">
                  FreeAgent Connected Successfully
                </p>
                <p className="text-green-700 text-sm">
                  Ready for automated eBay transaction sync
                </p>
              </div>
            </div>
          </div>

          {/* eBay Account Setup */}
          <div className="bg-emerald-100 border border-emerald-300 rounded-lg p-4">
            <h4 className="font-bold text-emerald-900 mb-3">
              eBay Sales Account
            </h4>

            {ebayAccountStatus.hasEbayAccount ? (
              /* Account Ready State */
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <svg
                    className="h-4 w-4 text-green-600 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-bold text-green-800">
                    {ebayAccountStatus.bankAccount?.name ||
                      "eBay UK seller Account"}{" "}
                    account ready
                  </span>
                </div>
                <p className="text-emerald-700 text-sm">
                  All eBay transactions will sync to this dedicated account
                  for clean organization
                </p>
                {ebayAccountStatus.autoCreated && (
                  <p className="text-emerald-600 text-xs">
                    ✨ New account created following FreeAgent best practices
                  </p>
                )}
                {!ebayAccountStatus.autoCreated && (
                  <p className="text-emerald-600 text-xs">
                    ✅ Using your existing eBay account safely
                  </p>
                )}
              </div>
            ) : needsAccountSelection ? (
              /* Account Selection State */
              <div className="space-y-3">
                <p className="text-emerald-800 text-sm font-medium">
                  Found {availableEbayAccounts.length} existing eBay account
                  {availableEbayAccounts.length > 1 ? "s" : ""}. Please select
                  which one to use:
                </p>
                <div className="space-y-2">
                  {availableEbayAccounts.map((account) => (
                    <button
                      key={account.id}
                      onClick={() => onSelectEbayAccount(account.apiUrl || account.url)}
                      disabled={isLoading}
                      className="w-full text-left p-3 border border-green-300 rounded-md hover:bg-green-100 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                    >
                      <div className="font-bold text-green-900">
                        {account.name}
                      </div>
                      <div className="text-sm text-green-700">
                        {account.type} • {account.currency}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-3 p-3 bg-yellow-100 border border-yellow-300 rounded-md">
                  <p className="text-yellow-800 text-xs">
                    Safe mode: We found existing eBay accounts and will never
                    create duplicates. Select one above to continue.
                  </p>
                </div>
              </div>
            ) : (
              /* Account Creation State */
              <div className="space-y-3">
                <p className="text-emerald-800 text-sm">
                  We'll create a dedicated "eBay UK seller Account" bank
                  account in FreeAgent for clean transaction organization.
                </p>
                <ul className="text-emerald-700 text-sm space-y-1">
                  <li>• Follows FreeAgent's Amazon module pattern</li>
                  <li>
                    • Keeps eBay transactions separate from other business
                    accounts
                  </li>
                  <li>• Safe creation - only if no eBay accounts exist</li>
                  <li>• No risk of duplicating existing accounts</li>
                </ul>
                <button
                  onClick={async () => {
                    setCreatingAccount(true);
                    await onCreateEbayAccount();
                    setCreatingAccount(false);
                  }}
                  disabled={creatingAccount || isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors text-sm flex items-center space-x-2 font-medium"
                >
                  {(creatingAccount || isLoading) && (
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  )}
                  <span>
                    {creatingAccount
                      ? "Setting Up Account..."
                      : isLoading
                      ? "Loading..."
                      : "Set Up eBay Sales Account"}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Disconnect Button */}
          <button
            onClick={onDisconnectFreeAgent}
            className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
          >
            Disconnect FreeAgent
          </button>
        </div>
      ) : (
        /* Not Connected State */
        <div className="space-y-4">
          <div className="bg-green-100 border border-green-300 rounded-lg p-4">
            <h4 className="font-bold text-green-900 mb-2">
              Connect Your FreeAgent Account
            </h4>
            <p className="text-green-800 text-sm mb-4">
              Safe setup that creates "eBay UK seller Account" following
              FreeAgent's Amazon module pattern.
            </p>
            <ul className="text-green-700 text-sm space-y-1">
              <li>• Works with existing eBay accounts safely</li>
              <li>• No risk of deleting or duplicating accounts</li>
              <li>• Clean separation of eBay transactions</li>
              <li>• Enhanced transaction descriptions</li>
              <li>• Secure OAuth connection</li>
            </ul>
          </div>
          <button
            onClick={onConnectFreeAgent}
            disabled={isLoading}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading ? "Connecting..." : "Connect to FreeAgent"}
          </button>
        </div>
      )}
    </div>
  );
};

// Enhanced Setup Progress with Brand Colors
const SetupProgress: React.FC<{ setupStatus: SetupStatus }> = ({ setupStatus }) => {
  const steps = [
    {
      name: "Connect eBay",
      completed: setupStatus.ebayConnected,
      description: "Link your eBay account",
      color: "blue",
    },
    {
      name: "Connect FreeAgent",
      completed: setupStatus.freeagentConnected,
      description: "Link your FreeAgent account",
      color: "green",
    },
    {
      name: "Setup eBay Account",
      completed: setupStatus.ebayAccountReady,
      description: "Auto-create dedicated account",
      color: "purple",
    },
  ];

  return (
    <div className="bg-gradient-to-r from-blue-50 via-green-50 to-purple-50 border-2 border-gray-300 rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        Setup Progress
      </h3>
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={step.name} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-4 ${
                step.completed
                  ? step.color === 'blue' ? "bg-blue-100 text-blue-800 border border-blue-300"
                  : step.color === 'green' ? "bg-green-100 text-green-800 border border-green-300"
                  : "bg-purple-100 text-purple-800 border border-purple-300"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {step.completed ? (
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                index + 1
              )}
            </div>
            <div className="flex-1">
              <div
                className={`font-bold ${
                  step.completed ? 
                    step.color === 'blue' ? "text-blue-700"
                    : step.color === 'green' ? "text-green-700"
                    : "text-purple-700"
                    : "text-gray-700"
                }`}
              >
                {step.name}
              </div>
              <div className="text-sm text-gray-600">{step.description}</div>
            </div>
          </div>
        ))}
      </div>

      {setupStatus.readyToSync && (
        <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg">
          <div className="flex items-center">
            <svg
              className="h-5 w-5 text-green-600 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-green-800 font-bold">Ready to Sync!</p>
              <p className="text-green-700 text-sm">
                All setup complete. You can now fetch and sync transactions.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};