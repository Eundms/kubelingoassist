import React from 'react';
import { AIChat } from '../chat';

interface AIChatSectionProps {
  onSendMessage: (message: string) => void;
}

export const AIChatSection: React.FC<AIChatSectionProps> = ({ onSendMessage }) => {
  return (
    <div className="ai-section">
      <AIChat onSendMessage={onSendMessage} />
    </div>
  );
};