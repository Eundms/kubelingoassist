// src/commands.ts
import * as vscode from 'vscode';
import { getTranslationPath, openSplitView } from './translation-utils';
import { setupSynchronizedScrolling, cleanupScrollListeners } from './scroll-sync';
import { StatusBarManager } from './status-bar';
import { TranslationViewProvider } from './webview-providers';

const KEY_SYNC = 'syncScrollEnabled';

let isSyncScrollEnabled = false;

let statusBarManager: StatusBarManager;
let translationViewProvider: TranslationViewProvider;
let ctx: vscode.ExtensionContext;

export function setDependencies(
  statusBarMgr: StatusBarManager,
  translationViewProv: TranslationViewProvider
) {
  statusBarManager = statusBarMgr;
  translationViewProvider = translationViewProv;
}

// extension.ts에서 초기 저장값을 넘겨 UI/내부 상태를 맞춤
export function initStateFromStorage(context: vscode.ExtensionContext) {
  ctx = context;
  isSyncScrollEnabled = ctx.workspaceState.get<boolean>(KEY_SYNC, false);

  // 초기 리스너 상태(실제 on/off는 extension.ts에서 처리)

  // Webview 초기 동기화(React는 stateUpdate로만 갱신)
  translationViewProvider?.broadcastState({
    syncScrollEnabled: isSyncScrollEnabled,
  });
}

export function getState() {
  return {
    isSyncScrollEnabled,
  };
}

export function registerCommands(context: vscode.ExtensionContext) {
  // 내부에서도 쓸 수 있도록 보관
  ctx = context;

  context.subscriptions.push(
    vscode.commands.registerCommand('kubelingoassist.openTranslation', openTranslation),
    vscode.commands.registerCommand('kubelingoassist.toggleSyncScroll', toggleSyncScroll),
  );
}

async function openTranslation(uri?: vscode.Uri) {
  const currentEditor = vscode.window.activeTextEditor;
  let filePath: string | undefined;

  if (uri) filePath = uri.fsPath;
  else if (currentEditor) filePath = currentEditor.document.uri.fsPath;

  if (!filePath) {
    vscode.window.showErrorMessage('활성화된 파일이 없습니다.');
    return;
  }

  const translationPath = await getTranslationPath(filePath);
  if (!translationPath) {
    vscode.window.showErrorMessage('번역 파일 경로를 찾을 수 없습니다.');
    return;
  }

  await openSplitView(filePath, translationPath);
  await statusBarManager.updateAllStatusBarItems(filePath, translationPath);

  // 웹뷰에 방송
  translationViewProvider.broadcastState({
    syncScrollEnabled: isSyncScrollEnabled,
  });
}


function toggleSyncScroll() {
  isSyncScrollEnabled = !isSyncScrollEnabled;

  if (isSyncScrollEnabled) {
    setupSynchronizedScrolling();
    vscode.window.showInformationMessage('동기화 스크롤이 활성화되었습니다.');
  } else {
    cleanupScrollListeners();
    vscode.window.showInformationMessage('동기화 스크롤이 비활성화되었습니다.');
  }

  // 저장 + 웹뷰 방송(단일 창구)
  void ctx.workspaceState.update(KEY_SYNC, isSyncScrollEnabled);
  translationViewProvider.broadcastState({ 
    syncScrollEnabled: isSyncScrollEnabled
  });
}
