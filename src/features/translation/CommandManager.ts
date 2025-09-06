// src/commands.ts
import * as vscode from 'vscode';
import { TranslationManagerFactory } from './managers';
import { setupSynchronizedScrolling, cleanupScrollListeners } from './ScrollSyncManager';
import { StatusBarManager } from '../ui/status-bar';
import { TranslationViewProvider } from '../ui/webview-providers';
import { GitUtils } from '../git/GitUtils';
import { i18n } from '../../core/i18n';

const KEY_SYNC = 'syncScrollEnabled';
const KEY_KUBELINGO = 'kubelingoEnabled';
const KEY_MODE = 'kubelingoMode';

interface AppState {
  syncScrollEnabled: boolean;
  kubelingoEnabled: boolean;
  mode: 'translation' | 'review';
}

export class CommandManager {
  private isSyncScrollEnabled = false;
  private isKubelingoEnabled = false;
  private currentMode: 'translation' | 'review' = 'translation';
  private gitUtils: GitUtils | null = null;
  private readonly pathManager = TranslationManagerFactory.getPathManager();
  private readonly fileManager = TranslationManagerFactory.getFileManager();

  constructor(
    private context: vscode.ExtensionContext,
    private statusBarManager: StatusBarManager,
    private translationViewProvider: TranslationViewProvider
  ) {
    this.initializeGitUtils();
  }

  private initializeGitUtils(): void {
    try {
      this.gitUtils = new GitUtils();
    } catch (error) {
      console.error('Failed to initialize GitUtils:', error);
    }
  }

  public initStateFromStorage(): void {
    this.isSyncScrollEnabled = this.context.workspaceState.get<boolean>(KEY_SYNC, false);
    this.isKubelingoEnabled = this.context.workspaceState.get<boolean>(KEY_KUBELINGO, false);
    this.currentMode = this.context.workspaceState.get<'translation' | 'review'>(KEY_MODE, 'translation');

    this.broadcastState();
  }

  public getState(): AppState {
    return {
      syncScrollEnabled: this.isSyncScrollEnabled,
      kubelingoEnabled: this.isKubelingoEnabled,
      mode: this.currentMode,
    };
  }

  public registerCommands(): void {
    this.context.subscriptions.push(
      vscode.commands.registerCommand('kubelingoassist.openTranslationFile', (uri?: vscode.Uri) => this.openTranslationFile(uri)),
      vscode.commands.registerCommand('kubelingoassist.openReviewFile', () => this.openReviewFile()),
      vscode.commands.registerCommand('kubelingoassist.toggleSyncScroll', () => this.toggleSyncScroll()),
      vscode.commands.registerCommand('kubelingoassist.toggleKubelingo', () => this.toggleKubelingo()),
      vscode.commands.registerCommand('kubelingoassist.changeMode', (mode: 'translation' | 'review') => this.changeMode(mode)),
    );
  }

  private broadcastState(): void {
    this.translationViewProvider.broadcastState(this.getState());
  }

  private async saveState(): Promise<void> {
    await Promise.all([
      this.context.workspaceState.update(KEY_SYNC, this.isSyncScrollEnabled),
      this.context.workspaceState.update(KEY_KUBELINGO, this.isKubelingoEnabled),
      this.context.workspaceState.update(KEY_MODE, this.currentMode)
    ]);
    this.broadcastState();
  }

  private async openTranslationFile(uri?: vscode.Uri): Promise<void> {
    if (!this.isKubelingoEnabled) {
    vscode.window.showInformationMessage(i18n.t('commands.kubelingo.disabled'));
    return;
  }

  // Check if this is a kubernetes/website repository
  if (this.gitUtils) {
    const isK8sRepo = await this.gitUtils.isKubernetesWebsiteRepository();
    if (!isK8sRepo) {
      vscode.window.showErrorMessage(
        i18n.t('commands.openTranslationFile.repositoryError')
      );
      return;
    }
  }

  const currentEditor = vscode.window.activeTextEditor;
  let filePath: string | undefined;

  if (uri) filePath = uri.fsPath;
  else if (currentEditor) filePath = currentEditor.document.uri.fsPath;

  if (!filePath) {
    vscode.window.showErrorMessage(i18n.t('commands.openTranslationFile.noActiveFile'));
    return;
  }

  try {
    const translationPath = await this.pathManager.getTranslationPath(filePath);
    if (!translationPath) {
      vscode.window.showErrorMessage(
        i18n.t('commands.openTranslationFile.noTranslationPath')
      );
      return;
    }

    await this.fileManager.openSplitView(filePath, translationPath);
    await this.statusBarManager.updateAllStatusBarItems(filePath, translationPath);
    this.broadcastState();
  } catch (error) {
    vscode.window.showErrorMessage(
      error instanceof Error ? error.message : String(error)
    );
    return;
  }
}

  private async openReviewFile(): Promise<void> {
  console.log('openReviewFileFileSelection called');
  
  if (!this.gitUtils) {
    console.log('Git utilities not available');
    vscode.window.showErrorMessage(i18n.t('commands.openReviewFile.gitNotAvailable'));
    return;
  }

  // Check if this is a kubernetes/website repository
  const isK8sRepo = await this.gitUtils.isKubernetesWebsiteRepository();
  if (!isK8sRepo) {
    vscode.window.showErrorMessage(
      i18n.t('commands.openTranslationFile.repositoryError')
    );
    return;
  }

  try {
    console.log('Getting recent commit info...');
    const commitInfo = await this.gitUtils.getRecentCommit();
    console.log('Commit info:', commitInfo);
    
    if (!commitInfo) {
      console.log('No recent commits found');
      vscode.window.showErrorMessage(i18n.t('commands.openReviewFile.noCommits'));
      return;
    }

    console.log('All files in commit:', commitInfo.files.map(f => f.path));
    const translationFiles = this.gitUtils.filterTranslationFiles(commitInfo.files);
    console.log('Filtered translation files:', translationFiles.map(f => f.path));
    
    if (translationFiles.length === 0) {
      console.log('No translation files found after filtering');
      vscode.window.showErrorMessage(
        i18n.t('commands.openReviewFile.noTranslationFiles')
      );
      return;
    }

    // Create quick pick items
    const quickPickItems = await Promise.all(
      translationFiles.map(async file => {
        return {
          label: vscode.workspace.asRelativePath(file.absPath, false), // 보기용은 상대경로
          description: file.status === 'M' ? i18n.t('commands.openReviewFile.status.modified')
                    : file.status === 'A' ? i18n.t('commands.openReviewFile.status.added')
                    : i18n.t('commands.openReviewFile.status.other'),
          detail: i18n.t('commands.openReviewFile.commitFrom', commitInfo.message),
          filePath: file.absPath  // 실제 사용할 경로는 절대경로!
        };
      })
    );
    const selectedFile = await vscode.window.showQuickPick(quickPickItems, {
      placeHolder: i18n.t('commands.openReviewFile.pickPlaceholder'),
      matchOnDescription: true,
      matchOnDetail: true
    });

    if (selectedFile) {
      console.log('Selected file for review:', selectedFile.filePath);
      await this.openFileInReviewMode(selectedFile.filePath);
    }
  } catch (error) {
    vscode.window.showErrorMessage(i18n.t('git.commitInfoFailed', String(error)));
  }
}


  private async toggleSyncScroll(): Promise<void> {
  if (!this.isKubelingoEnabled) {
    vscode.window.showInformationMessage(i18n.t('commands.kubelingo.disabled'));
    return;
  }

  this.isSyncScrollEnabled = !this.isSyncScrollEnabled;

  if (this.isSyncScrollEnabled) {
    setupSynchronizedScrolling();
    vscode.window.showInformationMessage(i18n.t('commands.kubelingo.toggleSyncScroll.enabled'));
  } else {
    cleanupScrollListeners();
    vscode.window.showInformationMessage(i18n.t('commands.kubelingo.toggleSyncScroll.disabled'));
  }

  await this.saveState();
}

  private async toggleKubelingo(): Promise<void> {
  console.log('toggleKubelingo function called, current state:', this.isKubelingoEnabled);
  this.isKubelingoEnabled = !this.isKubelingoEnabled;
  console.log('toggleKubelingo new state:', this.isKubelingoEnabled);

  if (this.isKubelingoEnabled) {
    vscode.window.showInformationMessage(i18n.t('commands.kubelingo.enabled'));
  } else {
    vscode.window.showInformationMessage('KubelingoAssist disabled.');
    // Disable sync scroll when kubelingo is disabled
    if (this.isSyncScrollEnabled) {
      this.isSyncScrollEnabled = false;
      cleanupScrollListeners();
    }
  }

  console.log('Broadcasting state to webview:', this.getState());
  await this.saveState();
}

  private async changeMode(mode: 'translation' | 'review'): Promise<void> {
  if (!this.isKubelingoEnabled) {
    vscode.window.showInformationMessage(i18n.t('commands.kubelingo.disabled'));
    return;
  }

  this.currentMode = mode;

  if (this.currentMode === 'review') {
    vscode.window.showInformationMessage(i18n.t('commands.kubelingo.mode.review'));
  } else {
    vscode.window.showInformationMessage(i18n.t('commands.kubelingo.mode.translation'));
  }

  await this.saveState();
}

  private async openFileInReviewMode(filePath: string): Promise<void> {
  if (!this.gitUtils) {
    vscode.window.showErrorMessage(i18n.t('commands.openReviewFile.gitNotAvailable'));
    return;
  }

  try {
    // Get the original English file path
    const originalEnglishPath = this.gitUtils.getOriginalEnglishPath(filePath);
    if (!originalEnglishPath) {
      vscode.window.showErrorMessage(i18n.t('commands.openReviewFile.noOriginalPath'));
      return;
    }

    // Open split view with translation file and original English file
    await this.fileManager.openSplitView(originalEnglishPath, filePath);
    await this.statusBarManager.updateAllStatusBarItems(originalEnglishPath, filePath);

    vscode.window.showInformationMessage(i18n.t('commands.openReviewFile.opened', filePath));
  } catch (error) {
    vscode.window.showErrorMessage(i18n.t('commands.openReviewFile.failed', String(error)));
  }
}
}
