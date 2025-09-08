import React, { useState } from 'react';
import { makeAuthenticatedRequest } from '../utils/apiUtils';

interface TwoFactorSetupProps {
  onComplete: () => void;
  onCancel: () => void;
}

const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<'setup' | 'verify' | 'backup'>('setup');
  const [qrCode, setQrCode] = useState<string>('');
  const [manualKey, setManualKey] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const setupTwoFactor = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await makeAuthenticatedRequest('/2fa/setup', {
        method: 'POST',
      });
      setQrCode(response.qrCode);
      setManualKey(response.manualEntryKey);
      setStep('verify');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const verifySetup = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await makeAuthenticatedRequest('/2fa/verify-setup', {
        method: 'POST',
        body: JSON.stringify({ token: verificationCode }),
      });
      setBackupCodes(response.backupCodes);
      setStep('backup');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadBackupCodes = () => {
    const content = `eBay Helper - 2FA Backup Codes
Generated: ${new Date().toLocaleDateString()}

These codes can be used to access your account if you lose your authenticator device.
Each code can only be used once.

${backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}

Keep these codes in a safe place!`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ebay-helper-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  React.useEffect(() => {
    if (step === 'setup') {
      setupTwoFactor();
    }
  }, [step]);

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Setup Two-Factor Authentication
      </h2>

      {step === 'setup' && (
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Setting up 2FA...</p>
        </div>
      )}

      {step === 'verify' && (
        <div>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Scan QR Code</h3>
            <p className="text-sm text-gray-600 mb-4">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </p>
            {qrCode && (
              <div className="flex justify-center mb-4">
                <img src={qrCode} alt="2FA QR Code" className="border rounded" />
              </div>
            )}
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Manual Entry</h3>
            <p className="text-sm text-gray-600 mb-2">
              Or enter this key manually in your authenticator app:
            </p>
            <code className="block bg-gray-100 p-2 rounded text-sm break-all">
              {manualKey}
            </code>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Enter 6-digit code"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={6}
            />
          </div>

          {error && (
            <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={verifySetup}
              disabled={loading || verificationCode.length !== 6}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & Enable'}
            </button>
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {step === 'backup' && (
        <div>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 text-green-600">
              2FA Enabled Successfully!
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Save these backup codes in a secure location. You can use them to access your account if you lose your authenticator device.
            </p>
          </div>

          <div className="mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                {backupCodes.map((code, index) => (
                  <div key={index} className="bg-white p-2 rounded text-center">
                    {code}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={downloadBackupCodes}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
            >
              Download Codes
            </button>
            <button
              onClick={onComplete}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TwoFactorSetup;