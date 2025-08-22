import React, { useState } from 'react';
import { ChatHistory } from './ChatHistory';
import { ChatInput } from './ChatInput';
import { ChatMessage } from './ChatMessage';
import { TranslationGuideTooltip } from '../ui';

interface AIChatProps {
  onSendMessage?: (message: string) => void;
}

export const AIChat: React.FC<AIChatProps> = ({ onSendMessage }) => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const handleSendMessage = (message: string) => {
    // 사용자 메시지를 대화 내역에 추가
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: message,
      isUser: true,
      timestamp: new Date()
    };
    
    setChatHistory(prev => [...prev, userMessage]);
    
    if (onSendMessage) {
      onSendMessage(message);
    }
    
    // TODO: AI 응답 시뮬레이션 (실제로는 VS Code에서 응답을 받아와야 함)
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: `"${message}"에 대한 번역 도움이 필요하시군요. 구체적인 번역 문제를 알려주시면 더 정확한 도움을 드릴 수 있습니다.`,
        isUser: false,
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, aiMessage]);
    }, 1000);
  };

  return (
    <div className="ai-chat-container">
      <div className="ai-chat-header">
        <span>🤖 번역 도우미</span>
        <TranslationGuideTooltip />
      </div>
      
      <ChatHistory messages={chatHistory} />
      
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
};