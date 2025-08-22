import React, { useState, useEffect } from 'react';
import { useVSCodeAPI } from '../../hooks/useVSCodeAPI';
import { ControlSection } from './ControlSection';
import { AIChatSection } from './AIChatSection';

interface AppState {
  syncScrollEnabled: boolean;
}

export const TranslationView: React.FC = () => {
  const {
    openTranslation,
    toggleSyncScroll,
    sendAIMessage,
    initialState,
    vscodeGetState,
    vscodeSetState,
  } = useVSCodeAPI();

  const [appState, setAppState] = useState<AppState>({
    syncScrollEnabled: false,
  });

  useEffect(() => {
    // 1) 웹뷰 로컬(getState) 우선 복원
    const saved = vscodeGetState?.();
    if (saved) {
      setAppState(prev => ({
        ...prev,
        syncScrollEnabled: typeof saved.syncScrollEnabled === 'boolean' ? saved.syncScrollEnabled : prev.syncScrollEnabled,
      }));
    } else if (initialState) {
      // 2) 확장에서 주입한 초기 상태
      setAppState(prev => ({
        ...prev,
        syncScrollEnabled: typeof initialState.syncScrollEnabled === 'boolean' ? initialState.syncScrollEnabled : prev.syncScrollEnabled,
      }));
    }

    // 3) 확장 → 웹뷰 상태 방송 수신
    const messageListener = (event: MessageEvent) => {
      const message = event.data;
      if (message?.type === 'stateUpdate' && message?.payload) {
        const { syncScrollEnabled: nextSync } = message.payload;
        
        setAppState(prev => {
          const newState = { ...prev };
          if (typeof nextSync === 'boolean') newState.syncScrollEnabled = nextSync;
          
          // 수신 즉시 웹뷰 로컬에도 저장
          vscodeSetState?.(newState);
          return newState;
        });
      }
    };

    window.addEventListener('message', messageListener);
    return () => window.removeEventListener('message', messageListener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 최초 1회만

  // 로컬 state가 바뀔 때(초기화 포함) 웹뷰 로컬 스토리지에도 저장
  useEffect(() => {
    vscodeSetState?.(appState);
  }, [appState, vscodeSetState]);

  const handleToggleSyncScroll = () => {
    // 실제 토글은 확장에서 수행 → stateUpdate 수신 후 위에서 반영
    toggleSyncScroll();
  };

  const handleAIMessage = (message: string) => {
    sendAIMessage(message);
  };

  return (
    <div>
      <ControlSection
        syncScrollEnabled={appState.syncScrollEnabled}
        onOpenTranslation={openTranslation}
        onToggleSyncScroll={handleToggleSyncScroll}
      />
      <AIChatSection onSendMessage={handleAIMessage} />
    </div>
  );
};
