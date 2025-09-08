import React, { useState } from 'react';

interface TwoFactorVerificationProps {
  onVerified: (token: string, isBackupCode: boolean) => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string;
}

const TwoFactorVerification: React.FC<TwoFactorVerificationProps> = ({
  onVerified,
  onCancel,
  loading = false,
  error = '',
}) => {
  const [code, setCode] = useState<string>('');
  const [useBackupCode, setUseBackupCode] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      onVerified(code.trim(), useBackupCode);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Two-Factor Authentication
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {useBackupCode ? 'Backup Code' : 'Authenticator Code'}
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={useBackupCode ? 'Enter backup code' : 'Enter 6-digit code'}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg"
            maxLength={useBackupCode ? 8 : 6}
            autoComplete="off"
          />
        </div>

        {error && (
          <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex space-x-3 mb-4">
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setUseBackupCode(!useBackupCode);
              setCode('');
            }}
            className="text-blue-600 hover:underline text-sm"
          >
            {useBackupCode ? 'Use authenticator code' : 'Use backup code'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TwoFactorVerification;