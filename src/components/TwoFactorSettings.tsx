import React, { useState, useEffect } from 'react';
import { makeAuthenticatedRequest } from '../utils/apiUtils';
import TwoFactorSetup from './TwoFactorSetup';

interface TwoFactorStatus {
  enabled: boolean;
  verified: boolean;
  backupCodesRemaining: number;
}

const TwoFactorSettings: React.FC = () => {
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showSetup, setShowSetup] = useState<boolean>(false);
  const [showDisable, setShowDisable] = useState<boolean>(false);
  const [showRegenerateBackup, setShowRegenerateBackup] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [newBackupCodes, setNewBackupCodes] = useState<string[]>([]);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await makeAuthenticatedRequest('/2fa/status');
      setStatus(response);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    setActionLoading(true);
    setError('');
    try {
      await makeAuthenticatedRequest('/2fa/disable', {
        method: 'POST',
        body: JSON.stringify({
          password,
          token: verificationCode,
        }),
      });
      setShowDisable(false);
      setPassword('');
      setVerificationCode('');
      await fetchStatus();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    setActionLoading(true);
    setError('');
    try {
      const response = await makeAuthenticatedRequest('/2fa/regenerate-backup-codes', {
        method: 'POST',
        body: JSON.stringify({
          token: verificationCode,
        }),
      });
      setNewBackupCodes(response.backupCodes);
      setVerificationCode('');
      await fetchStatus();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const downloadBackupCodes = (codes: string[]) => {
    const content = `eBay Helper - 2FA Backup Codes
Generated: ${new Date().toLocaleDateString()}

These codes can be used to access your account if you lose your authenticator device.
Each code can only be used once.

${codes.map((code, index) => `${index + 1}. ${code}`).join('\n')}

Keep these codes in a safe place!`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ebay-helper-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (showSetup) {
    return (
      <TwoFactorSetup
        onComplete={() => {
          setShowSetup(false);
          fetchStatus();
        }}
        onCancel={() => setShowSetup(false)}
      />
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Two-Factor Authentication
      </h3>

      {status?.enabled ? (
        <div>
          <div className="flex items-center mb-4">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <span className="text-green-700 font-medium">2FA is enabled</span>
          </div>
          
          <p className="text-gray-600 mb-4">
            Your account is protected with two-factor authentication.
            You have {status.backupCodesRemaining} backup codes remaining.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => setShowRegenerateBackup(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mr-3"
            >
              Regenerate Backup Codes
            </button>
            
            <button
              onClick={() => setShowDisable(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Disable 2FA
            </button>
          </div>

          {/* Disable 2FA Modal */}
          {showDisable && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h4 className="text-lg font-semibold mb-4">Disable Two-Factor Authentication</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your password"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      2FA Code
                    </label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <button
                      onClick={handleDisable2FA}
                      disabled={actionLoading || !password || verificationCode.length !== 6}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      {actionLoading ? 'Disabling...' : 'Disable 2FA'}
                    </button>
                    <button
                      onClick={() => {
                        setShowDisable(false);
                        setPassword('');
                        setVerificationCode('');
                        setError('');
                      }}
                      className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Regenerate Backup Codes Modal */}
          {showRegenerateBackup && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h4 className="text-lg font-semibold mb-4">Regenerate Backup Codes</h4>
                
                {newBackupCodes.length > 0 ? (
                  <div>
                    <p className="text-sm text-gray-600 mb-4">
                      Your new backup codes have been generated. Save them in a secure location.
                    </p>
                    
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                        {newBackupCodes.map((code, index) => (
                          <div key={index} className="bg-white p-2 rounded text-center">
                            {code}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={() => downloadBackupCodes(newBackupCodes)}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
                      >
                        Download Codes
                      </button>
                      <button
                        onClick={() => {
                          setShowRegenerateBackup(false);
                          setNewBackupCodes([]);
                          setVerificationCode('');
                        }}
                        className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600 mb-4">
                      This will invalidate your current backup codes and generate new ones.
                    </p>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        2FA Code
                      </label>
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                      />
                    </div>

                    {error && (
                      <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">
                        {error}
                      </div>
                    )}

                    <div className="flex space-x-3">
                      <button
                        onClick={handleRegenerateBackupCodes}
                        disabled={actionLoading || verificationCode.length !== 6}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {actionLoading ? 'Generating...' : 'Regenerate'}
                      </button>
                      <button
                        onClick={() => {
                          setShowRegenerateBackup(false);
                          setVerificationCode('');
                          setError('');
                        }}
                        className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-center mb-4">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
            <span className="text-red-700 font-medium">2FA is disabled</span>
          </div>
          
          <p className="text-gray-600 mb-4">
            Add an extra layer of security to your account by enabling two-factor authentication.
          </p>

          <button
            onClick={() => setShowSetup(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Enable 2FA
          </button>
        </div>
      )}

      {error && !showDisable && !showRegenerateBackup && (
        <div className="mt-4 bg-red-50 text-red-700 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default TwoFactorSettings;