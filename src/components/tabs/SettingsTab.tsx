import React from 'react';
import TwoFactorSettings from '../TwoFactorSettings';
import { User } from '../../types';

interface SettingsTabProps {
  user: User;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ user }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Settings</h3>
        <p className="text-gray-600 text-sm">Manage your account security and preferences</p>
      </div>
      
      <TwoFactorSettings />
      
      {/* Future settings components can go here:
      <NotificationSettings />
      <ApiSettings />
      <BillingSettings />
      */}
    </div>
  );
};

export default SettingsTab;