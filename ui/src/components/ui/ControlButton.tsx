import React from 'react';

interface ControlButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'sync-enabled';
  className?: string;
}

export const ControlButton: React.FC<ControlButtonProps> = ({ 
  onClick, 
  children, 
  variant = 'secondary',
  className = ''
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'primary':
        return 'primary-button';
      case 'sync-enabled':
        return 'sync-enabled';
      default:
        return 'secondary-button';
    }
  };

  return (
    <button
      className={`control-button ${getVariantClass()} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};