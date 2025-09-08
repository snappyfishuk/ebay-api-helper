// components/TrialAlert.tsx
import React, { useState, useEffect } from 'react';
import { makeAuthenticatedRequest } from '../utils/apiUtils';

interface TrialAlertProps {
  user?: any;
}

export const TrialAlert: React.FC<TrialAlertProps> = ({ user }) => {
  const [trialData, setTrialData] = useState<any>(null);

  useEffect(() => {
    const fetchTrial = async () => {
      try {
        const data = await makeAuthenticatedRequest('/users/subscription');
        setTrialData(data.data);
      } catch (error) {
        console.error('Trial fetch error:', error);
      }
    };
    fetchTrial();
  }, []);

  const isTestUser = user?.email === 'gary.arnold@hotmail.co.uk';

  if (isTestUser) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-green-800">
            ✓ Test Account - Unlimited Access
          </span>
          <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">
            Developer
          </span>
        </div>
      </div>
    );
  }

  if (!trialData || trialData.subscriptionStatus !== 'trial' || 
      (trialData.daysRemaining && trialData.daysRemaining > 5)) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-yellow-800">
          Trial ends in {trialData.daysRemaining || 0} day{(trialData.daysRemaining || 0) === 1 ? '' : 's'}
        </span>
        <button className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700">
          Upgrade
        </button>
      </div>
    </div>
  );
};