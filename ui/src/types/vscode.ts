// types/vscode.ts

// VS Code Webview API (웹뷰 런타임에서 주입되는 전역 함수의 반환형)
export interface VSCodeAPI {
  postMessage: (message: unknown) => void;
  // getState/setState는 환경/테스트에 따라 없을 수도 있으니 옵셔널로 두는 게 안전합니다.
  getState?: <T = any>() => T | undefined;
  setState?: (state: any) => void;
}

// 웹뷰 전역에 노출되는 acquireVsCodeApi() 선언
declare global {
  interface Window {
    // VS Code가 주입하는 전역 함수 (실행 환경에 따라 없을 수도 있어 옵셔널 체크 권장)
    acquireVsCodeApi?: () => VSCodeAPI;
    // 확장에서 초기 상태를 주입할 때 사용 (선택)
    initialState?: any;
  }
}

// ========== 메시지 타입 ==========

// 웹뷰 -> 확장 으로 보내는 메시지(아웃바운드)
export type VSCodeOutboundMessage =
  | { type: 'openTranslation' }
  | { type: 'toggleSyncScroll' }
  | { type: 'toggleTranslationMode' }
  | { type: 'aiChat'; payload: { message: string } };

// 확장 -> 웹뷰 로 들어오는 메시지(인바운드)
export type VSCodeInboundMessage =
  | { type: 'stateUpdate'; payload: { syncScrollEnabled: boolean } }
  // 필요 시 다른 브로드캐스트 메시지를 여기에 추가
  ;

// 통합 alias (양방향 모두 필요할 때)
export type VSCodeMessage = VSCodeOutboundMessage | VSCodeInboundMessage;
