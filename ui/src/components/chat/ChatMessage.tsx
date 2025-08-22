import React from 'react';

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatMessageProps {
  message: ChatMessage;
}

export const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message }) => {
  return (
    <div
      className={`ai-chat-message ${message.isUser ? 'user-message' : 'ai-message'}`}
    >
      <div className="message-content">
        {message.text}
      </div>
      <div className="message-timestamp">
        {message.timestamp.toLocaleTimeString('ko-KR', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </div>
    </div>
  );
};