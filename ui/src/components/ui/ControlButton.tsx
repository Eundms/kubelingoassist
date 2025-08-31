import React from 'react';

interface ControlButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'sync-enabled' | 'review-enabled';
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

export const ControlButton: React.FC<ControlButtonProps> = ({ 
  onClick, 
  children, 
  variant = 'secondary',
  className = '',
  style,
  disabled = false
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'primary':
        return 'primary-button';
      case 'sync-enabled':
        return 'sync-enabled';
      case 'review-enabled':
        return 'review-enabled';
      default:
        return 'secondary-button';
    }
  };

  return (
    <button
      className={`control-button ${getVariantClass()} ${className}`}
      onClick={onClick}
      style={style}
      disabled={disabled}
    >
      {children}
    </button>
  );
};