import React from 'react';
import { ChatMessage, ChatMessageComponent } from './ChatMessage';

interface ChatHistoryProps {
  messages: ChatMessage[];
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({ messages }) => {
  return (
    <div className="ai-chat-history">
      {messages.length === 0 ? (
        <div className="ai-chat-empty">
          번역에 대해 궁금한 점을 물어보세요! 🤖
        </div>
      ) : (
        messages.map((message) => (
          <ChatMessageComponent key={message.id} message={message} />
        ))
      )}
    </div>
  );
};