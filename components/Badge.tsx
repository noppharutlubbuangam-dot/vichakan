
import React from 'react';
import { TeamStatus } from '../types';

interface BadgeProps {
  status: TeamStatus;
}

export const Badge: React.FC<BadgeProps> = ({ status }) => {
  const statusStyles: Record<TeamStatus, string> = {
    [TeamStatus.Approved]: 'bg-green-100 text-green-800',
    [TeamStatus.Pending]: 'bg-yellow-100 text-yellow-800',
    [TeamStatus.Rejected]: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusStyles[status]}`}>
      {status}
    </span>
  );
};
