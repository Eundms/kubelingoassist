// src/commands.ts
import * as vscode from 'vscode';
import { getTranslationPath, openSplitView } from './translation-utils';
import { setupSynchronizedScrolling, cleanupScrollListeners } from './scroll-sync';
import { StatusBarManager } from '../ui/status-bar';
import { TranslationViewProvider } from '../ui/webview-providers';
import { GitUtils } from '../git/git-utils';
import { i18n } from '../i18n';

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
  isKubelingoEnabled = ctx.workspaceState.get<boolean>(KEY_KUBELINGO, true);
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
    i18n.showInformationMessage('messages.kubelingoDisabled');
    return;
  }

  // Check if this is a kubernetes/website repository
  if (gitUtils) {
    const isK8sRepo = await gitUtils.isKubernetesWebsiteRepository();
    if (!isK8sRepo) {
      i18n.showErrorMessage('messages.notKubernetesRepo');
      return;
    }
  }

  const currentEditor = vscode.window.activeTextEditor;
  let filePath: string | undefined;

  if (uri) filePath = uri.fsPath;
  else if (currentEditor) filePath = currentEditor.document.uri.fsPath;

  if (!filePath) {
    i18n.showErrorMessage('messages.noActiveFile');
    return;
  }

  const translationPath = await getTranslationPath(filePath);
  if (!translationPath) {
    i18n.showErrorMessage('messages.cannotFindTranslationPath');
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
    i18n.showErrorMessage('messages.gitUtilitiesNotAvailable');
    return;
  }

  // Check if this is a kubernetes/website repository
  const isK8sRepo = await gitUtils.isKubernetesWebsiteRepository();
  if (!isK8sRepo) {
    i18n.showErrorMessage('messages.kubernetesRepoOnly');
    return;
  }

  try {
    console.log('Getting recent commit info...');
    const commitInfo = await gitUtils.getRecentCommit();
    console.log('Commit info:', commitInfo);
    
    if (!commitInfo) {
      console.log('No recent commits found');
      i18n.showErrorMessage('messages.noRecentCommits');
      return;
    }

    console.log('All files in commit:', commitInfo.files.map(f => f.path));
    const translationFiles = gitUtils.filterTranslationFiles(commitInfo.files);
    console.log('Filtered translation files:', translationFiles.map(f => f.path));
    
    if (translationFiles.length === 0) {
      console.log('No translation files found after filtering');
      i18n.showErrorMessage('messages.noTranslationFilesFound');
      return;
    }

    // Create quick pick items
    const quickPickItems = await Promise.all(
      translationFiles.map(async file => {
        return {
          label: vscode.workspace.asRelativePath(file.absPath, false), // 보기용은 상대경로
          description: file.status === 'M' ? i18n.t('ui.fileStatus.modified')
                    : file.status === 'A' ? i18n.t('ui.fileStatus.added')
                    : i18n.t('ui.fileStatus.other'),
          detail: i18n.t('ui.fromCommit', { message: commitInfo.message }),
          filePath: file.absPath  // 실제 사용할 경로는 절대경로!
        };
      })
    );
    const selectedFile = await i18n.showQuickPick(quickPickItems, {
      placeholderKey: 'ui.selectFileToReview',
      matchOnDescription: true,
      matchOnDetail: true
    });

    if (selectedFile) {
      console.log('Selected file for review:', selectedFile.filePath);
      await openFileInReviewMode(selectedFile.filePath);
    }
  } catch (error) {
    i18n.showErrorMessage('messages.failedToGetRecentCommits', { error: String(error) });
  }
}


function toggleSyncScroll() {
  if (!isKubelingoEnabled) {
    i18n.showInformationMessage('messages.kubelingoDisabled');
    return;
  }

  isSyncScrollEnabled = !isSyncScrollEnabled;

  if (isSyncScrollEnabled) {
    setupSynchronizedScrolling();
    i18n.showInformationMessage('messages.syncScrollEnabled');
  } else {
    cleanupScrollListeners();
    i18n.showInformationMessage('messages.syncScrollDisabled');
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
    i18n.showInformationMessage('messages.kubelingoEnabled');
  } else {
    i18n.showInformationMessage('messages.kubelingoDisabledMsg');
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
    i18n.showInformationMessage('messages.kubelingoDisabled');
    return;
  }

  currentMode = mode;

  if (currentMode === 'review') {
    i18n.showInformationMessage('messages.reviewModeEnabled');
  } else {
    i18n.showInformationMessage('messages.translationModeEnabled');
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
    i18n.showErrorMessage('messages.gitUtilitiesNotAvailable');
    return;
  }

  try {
    // Get the original English file path
    const originalEnglishPath = gitUtils.getOriginalEnglishPath(filePath);
    if (!originalEnglishPath) {
      i18n.showErrorMessage('messages.couldNotDetermineOriginalPath');
      return;
    }

    // Open split view with translation file and original English file
    await openSplitView(originalEnglishPath, filePath);
    await statusBarManager.updateAllStatusBarItems(originalEnglishPath, filePath);

    i18n.showInformationMessage('messages.openedForReview', { path: filePath });
  } catch (error) {
    i18n.showErrorMessage('messages.failedToOpenReviewMode', { error: String(error) });
  }
}
