import React from 'react';

interface StatusBarProps {
  text?: string;
  kubelingoEnabled?: boolean;
  onToggleKubelingo?: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({ 
  text = 'KubeLingoAssist',
  kubelingoEnabled,
  onToggleKubelingo 
}) => {
  return (
    <div className="status-bar">
      <span className="status-text">{text}</span>
      {kubelingoEnabled !== undefined && onToggleKubelingo && (
        <button
          className={`status-toggle ${kubelingoEnabled ? 'status-toggle-on' : 'status-toggle-off'}`}
          onClick={onToggleKubelingo}
        >
          {kubelingoEnabled ? 'ON' : 'OFF'}
        </button>
      )}
    </div>
  );
};