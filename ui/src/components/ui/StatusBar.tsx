import React from 'react';

interface StatusBarProps {
  text?: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({ text = 'KubeLingoAssist' }) => {
  return (
    <div className="status-info">
      {text}
    </div>
  );
};