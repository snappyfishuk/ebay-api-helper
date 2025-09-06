// components/common/StatusBadge.tsx
import React from 'react';

interface StatusBadgeProps {
  status: 'connected' | 'disconnected' | 'ready' | 'pending';
  label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const getStatusClasses = () => {
    switch (status) {
      case 'connected':
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'disconnected':
        return 'bg-gray-100 text-gray-600';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getDefaultLabel = () => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'disconnected':
        return 'Not Connected';
      case 'ready':
        return 'Ready';
      case 'pending':
        return 'Setup Required';
      default:
        return status;
    }
  };

  return (
    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusClasses()}`}>
      {label || getDefaultLabel()}
    </div>
  );
};