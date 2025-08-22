import { useEffect, useRef, useCallback } from 'react';
import { VSCodeAPI, VSCodeMessage } from '../types/vscode';

// VS Code 웹뷰 전역 타입 안전 처리 (존재하지 않을 수도 있음)
declare global {
  // eslint-disable-next-line no-var
  var acquireVsCodeApi: undefined | (() => VSCodeAPI);
  interface Window {
    initialState?: any; // 확장에서 주입하는 초기 상태
  }
}

export const useVSCodeAPI = () => {
  const vscodeRef = useRef<VSCodeAPI | null>(null);

  // mount 시 한 번만 VS Code API 확보
  useEffect(() => {
    if (typeof acquireVsCodeApi !== 'undefined') {
      vscodeRef.current = acquireVsCodeApi();
    }
  }, []);

  const postMessage = useCallback((message: VSCodeMessage) => {
    vscodeRef.current?.postMessage(message);
  }, []);

  // ---- 상태 영속화 유틸 ----
  const vscodeGetState = useCallback((): any | undefined => {
    try {
      return vscodeRef.current?.getState?.();
    } catch {
      return undefined;
    }
  }, []);

  const vscodeSetState = useCallback((state: any) => {
    try {
      vscodeRef.current?.setState?.(state);
    } catch {
      /* noop */
    }
  }, []);

  // ---- 명령 래퍼 ----
  const openTranslation = useCallback(() => {
    postMessage({ type: 'openTranslation' });
  }, [postMessage]);

  const toggleSyncScroll = useCallback(() => {
    postMessage({ type: 'toggleSyncScroll' });
  }, [postMessage]);


  const sendAIMessage = useCallback((message: string) => {
    postMessage({ type: 'aiChat', payload: { message } });
  }, [postMessage]);

  return {
    // commands
    openTranslation,
    toggleSyncScroll,
    sendAIMessage,

    // vscode raw ref (필요 시 접근)
    vscode: vscodeRef.current,

    // persistence helpers
    vscodeGetState,
    vscodeSetState,

    // extension이 넣어주는 초기 상태(최초 로드 시 사용)
    initialState: typeof window !== 'undefined' ? window.initialState : undefined,
  };
};
