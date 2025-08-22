// src/webview-providers.ts
import * as vscode from 'vscode';

/**
 * React Webview 호스트 (React가 렌더/상태 관리, 여긴 번들 로드 + 브리지)
 */
export class TranslationViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'kubelingoassist-view';
  private readonly views = new Set<vscode.WebviewView>();

  private isSyncScrollEnabled = false;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this.views.add(webviewView);
    webviewView.onDidDispose(() => this.views.delete(webviewView));
    
    // 패널 표시 상태 변경 감지
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        // 패널이 다시 열렸을 때 현재 상태로 동기화
        this._broadcast();
      }
    });

    const webview = webviewView.webview;

    // ✅ 모듈 번들과 동적 chunk(assets/* 포함) 접근을 위해 dist 를 루트로 허용
    webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, 'ui', 'dist')],
    };

    // 최초 1회만 HTML 주입
    webview.html = this._getHtml(webview, {
      syncScrollEnabled: this.isSyncScrollEnabled,
    });

    // UI → 확장 브리지
    webview.onDidReceiveMessage((msg: any) => {
      switch (msg?.type) {
        case 'openTranslation':
          vscode.commands.executeCommand('kubelingoassist.openTranslation'); break;
        case 'toggleSyncScroll':
          vscode.commands.executeCommand('kubelingoassist.toggleSyncScroll'); break;
        case 'aiChat':
          vscode.window.showInformationMessage(`AI Message: ${msg?.payload?.message ?? ''}`); break;
      }
    });

    // 초기 상태 방송(로딩 타이밍 커버)
    this._broadcast();
  }

  public setSyncScrollEnabled(enabled: boolean) {
    this.isSyncScrollEnabled = enabled;
    this._broadcast();
  }
  public broadcastState(state: { syncScrollEnabled: boolean }) {
    if (typeof state.syncScrollEnabled === 'boolean') this.isSyncScrollEnabled = state.syncScrollEnabled;
    this._broadcast();
  }

  private _broadcast() {
    const payload = {
      syncScrollEnabled: this.isSyncScrollEnabled,
    };
    for (const v of this.views) {
      v.webview.postMessage({ type: 'stateUpdate', payload });
    }
  }

  private _getHtml(webview: vscode.Webview, initialState: any) {
    // ✅ Vite 산출물: ES Module main.js + (필요 시) chunk-[hash].js 들
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'ui', 'dist', 'main.js'),
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'ui', 'dist', 'main.css'),
    );

    const nonce = this._nonce();

    // ✅ 포인트:
    // - script-src 에 webview.cspSource 추가 → dist 에 있는 module/chunk 로드 허용
    // - inline 초기상태 주입은 nonce 로 허용
    // - <script type="module"> 로 ES Module 로딩 (Vite 기본)
    return /* html */ `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta
    http-equiv="Content-Security-Policy"
    content="
      default-src 'none';
      img-src ${webview.cspSource} blob: data:;
      style-src ${webview.cspSource} 'unsafe-inline';
      script-src 'nonce-${nonce}' ${webview.cspSource};
      font-src ${webview.cspSource} data:;
    "
  />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>KubeLingoAssist</title>
  <link rel="stylesheet" href="${styleUri}" />
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}">
    // React 최초 마운트용 초기 상태 (inline 스크립트는 nonce 로 허용)
    window.initialState = ${JSON.stringify(initialState)};
  </script>
  <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  private _nonce() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }
}
