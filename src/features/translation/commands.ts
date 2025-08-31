// src/commands.ts
import * as vscode from 'vscode';
import { getTranslationPath, openSplitView } from './translation-utils';
import { setupSynchronizedScrolling, cleanupScrollListeners } from './scroll-sync';
import { StatusBarManager } from '../ui/status-bar';
import { TranslationViewProvider } from '../ui/webview-providers';
import { GitUtils } from '../git/git-utils';

const KEY_SYNC = 'syncScrollEnabled';
const KEY_KUBELINGO = 'kubelingoEnabled';
const KEY_MODE = 'kubelingoMode';

let isSyncScrollEnabled = false;
let isKubelingoEnabled = false;
let currentMode: 'translation' | 'review' = 'translation';
let gitUtils: GitUtils | null = null;

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
  isKubelingoEnabled = ctx.workspaceState.get<boolean>(KEY_KUBELINGO, false);
  currentMode = ctx.workspaceState.get<'translation' | 'review'>(KEY_MODE, 'translation');

  // Initialize git utils
  try {
    gitUtils = new GitUtils();
  } catch (error) {
    console.error('Failed to initialize GitUtils:', error);
  }

  // Webview 초기 동기화(React는 stateUpdate로만 갱신)
  translationViewProvider?.broadcastState({
    syncScrollEnabled: isSyncScrollEnabled,
    kubelingoEnabled: isKubelingoEnabled,
    mode: currentMode,
  });
}

export function getState() {
  return {
    isSyncScrollEnabled,
    isKubelingoEnabled,
    currentMode,
  };
}

export function registerCommands(context: vscode.ExtensionContext) {
  // 내부에서도 쓸 수 있도록 보관
  ctx = context;

  context.subscriptions.push(
    vscode.commands.registerCommand('kubelingoassist.openTranslationFile', openTranslationFile),
    vscode.commands.registerCommand('kubelingoassist.openReviewFile', openReviewFile),
    vscode.commands.registerCommand('kubelingoassist.toggleSyncScroll', toggleSyncScroll),
    vscode.commands.registerCommand('kubelingoassist.toggleKubelingo', toggleKubelingo),
    vscode.commands.registerCommand('kubelingoassist.changeMode', changeMode),
  );
}


async function openTranslationFile(uri?: vscode.Uri) {
    if (!isKubelingoEnabled) {
    vscode.window.showInformationMessage('KubelingoAssist is disabled. Please enable it first.');
    return;
  }

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
    vscode.window.showErrorMessage(
      '번역 파일 경로를 찾을 수 없습니다. ' +
      '이 확장 프로그램은 Kubernetes 문서 저장소의 /content/en/ 또는 /content/{언어}/ 구조에서 작동합니다.'
    );
    return;
  }

  await openSplitView(filePath, translationPath);
  await statusBarManager.updateAllStatusBarItems(filePath, translationPath);

  // 웹뷰에 방송
  translationViewProvider.broadcastState({
    syncScrollEnabled: isSyncScrollEnabled,
    kubelingoEnabled: isKubelingoEnabled,
    mode: currentMode,
  });
}

async function openReviewFile() {
  console.log('openReviewFileFileSelection called');
  
  if (!gitUtils) {
    console.log('Git utilities not available');
    vscode.window.showErrorMessage('Git utilities not available');
    return;
  }

  try {
    console.log('Getting recent commit info...');
    const commitInfo = await gitUtils.getRecentCommit();
    console.log('Commit info:', commitInfo);
    
    if (!commitInfo) {
      console.log('No recent commits found');
      vscode.window.showErrorMessage('No recent commits found');
      return;
    }

    console.log('All files in commit:', commitInfo.files.map(f => f.path));
    const translationFiles = gitUtils.filterTranslationFiles(commitInfo.files);
    console.log('Filtered translation files:', translationFiles.map(f => f.path));
    
    if (translationFiles.length === 0) {
      console.log('No translation files found after filtering');
      vscode.window.showErrorMessage(
        'No translation files found in recent commits. ' +
        'This extension works with Kubernetes documentation repositories that have content/{language} structure. ' +
        'Make sure you have committed some translated markdown files in the expected directory structure.'
      );
      return;
    }

    // Create quick pick items
    const quickPickItems = await Promise.all(
      translationFiles.map(async file => {
        return {
          label: vscode.workspace.asRelativePath(file.absPath, false), // 보기용은 상대경로
          description: file.status === 'M' ? 'Modified'
                    : file.status === 'A' ? 'Added'
                    : file.status ?? 'Other',
          detail: `From commit: ${commitInfo.message}`,
          filePath: file.absPath  // 실제 사용할 경로는 절대경로!
        };
      })
    );
    const selectedFile = await vscode.window.showQuickPick(quickPickItems, {
      placeHolder: 'Select a translation file to review',
      matchOnDescription: true,
      matchOnDetail: true
    });

    if (selectedFile) {
      console.log('Selected file for review:', selectedFile.filePath);
      await openFileInReviewMode(selectedFile.filePath);
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to get recent commits: ${error}`);
  }
}


function toggleSyncScroll() {
  if (!isKubelingoEnabled) {
    vscode.window.showInformationMessage('KubelingoAssist is disabled. Please enable it first.');
    return;
  }

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
    syncScrollEnabled: isSyncScrollEnabled,
    kubelingoEnabled: isKubelingoEnabled,
    mode: currentMode
  });
}

function toggleKubelingo() {
  console.log('toggleKubelingo function called, current state:', isKubelingoEnabled);
  isKubelingoEnabled = !isKubelingoEnabled;
  console.log('toggleKubelingo new state:', isKubelingoEnabled);

  if (isKubelingoEnabled) {
    vscode.window.showInformationMessage('KubelingoAssist enabled.');
  } else {
    vscode.window.showInformationMessage('KubelingoAssist disabled.');
    // Disable sync scroll when kubelingo is disabled
    if (isSyncScrollEnabled) {
      isSyncScrollEnabled = false;
      cleanupScrollListeners();
      void ctx.workspaceState.update(KEY_SYNC, isSyncScrollEnabled);
    }
  }

  // 저장 + 웹뷰 방송
  void ctx.workspaceState.update(KEY_KUBELINGO, isKubelingoEnabled);
  console.log('Broadcasting state to webview:', {
    syncScrollEnabled: isSyncScrollEnabled,
    kubelingoEnabled: isKubelingoEnabled,
    mode: currentMode
  });
  translationViewProvider.broadcastState({
    syncScrollEnabled: isSyncScrollEnabled,
    kubelingoEnabled: isKubelingoEnabled,
    mode: currentMode
  });
}

function changeMode(mode: 'translation' | 'review') {
  if (!isKubelingoEnabled) {
    vscode.window.showInformationMessage('KubelingoAssist is disabled. Please enable it first.');
    return;
  }

  currentMode = mode;

  if (currentMode === 'review') {
    vscode.window.showInformationMessage('Review mode enabled. You can now see changed files from recent commits.');
  } else {
    vscode.window.showInformationMessage('Translation mode enabled.');
  }

  // 저장 + 웹뷰 방송
  void ctx.workspaceState.update(KEY_MODE, currentMode);
  translationViewProvider.broadcastState({
    syncScrollEnabled: isSyncScrollEnabled,
    kubelingoEnabled: isKubelingoEnabled,
    mode: currentMode
  });
}

async function openFileInReviewMode(filePath: string) {
  if (!gitUtils) {
    vscode.window.showErrorMessage('Git utilities not available');
    return;
  }

  try {
    // Get the original English file path
    const originalEnglishPath = gitUtils.getOriginalEnglishPath(filePath);
    if (!originalEnglishPath) {
      vscode.window.showErrorMessage('Could not determine original English file path');
      return;
    }

    // Open split view with translation file and original English file
    await openSplitView(originalEnglishPath, filePath);
    await statusBarManager.updateAllStatusBarItems(originalEnglishPath, filePath);

    vscode.window.showInformationMessage(`Opened ${filePath} with original English file for review`);
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to open file in review mode: ${error}`);
  }
}
