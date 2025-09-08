import * as vscode from 'vscode';
import { TranslationUtils } from './TranslationUtils';
import { ScrollSyncManager } from './ScrollSyncManager';
import { StatusBarManager } from '../ui/StatusBarManager';
import { TranslationViewProvider } from '../ui/webview-providers';
import { GitService } from '../git';
import { i18n } from '../i18n';

/**
 * 번역 관련 명령어를 관리하는 클래스입니다.
 * 상태 관리, 명령어 등록, 동기화 기능 등을 제공합니다.
 */
export class TranslationCommandManager {
    private static readonly KEY_SYNC = 'syncScrollEnabled';
    private static readonly KEY_KUBELINGO = 'kubelingoEnabled';
    private static readonly KEY_MODE = 'kubelingoMode';

    private isSyncScrollEnabled = false;
    private isKubelingoEnabled = false;
    private currentMode: 'translation' | 'review' = 'translation';
    private gitService: GitService | null = null;

    private statusBarManager: StatusBarManager | null = null;
    private translationViewProvider: TranslationViewProvider | null = null;
    private context: vscode.ExtensionContext | null = null;
    private translationUtils: TranslationUtils;
    private scrollSyncManager: ScrollSyncManager;

    constructor() {
        this.translationUtils = new TranslationUtils();
        this.scrollSyncManager = new ScrollSyncManager();
    }

    /**
     * 의존성을 설정합니다.
     */
    setDependencies(
        statusBarManager: StatusBarManager,
        translationViewProvider: TranslationViewProvider
    ): void {
        this.statusBarManager = statusBarManager;
        this.translationViewProvider = translationViewProvider;
    }

    /**
     * 저장된 상태에서 초기 상태를 로드합니다.
     */
    initStateFromStorage(context: vscode.ExtensionContext): void {
        this.context = context;
        this.isSyncScrollEnabled = context.workspaceState.get<boolean>(
            TranslationCommandManager.KEY_SYNC, 
            false
        );
        this.isKubelingoEnabled = context.workspaceState.get<boolean>(
            TranslationCommandManager.KEY_KUBELINGO, 
            true
        );
        this.currentMode = context.workspaceState.get<'translation' | 'review'>(
            TranslationCommandManager.KEY_MODE, 
            'translation'
        );

        this.initializeGitUtils();
        this.syncWebviewState();
    }

    /**
     * Git 서비스를 초기화합니다.
     */
    private initializeGitUtils(): void {
        try {
            this.gitService = new GitService();
        } catch (error) {
            console.error('Failed to initialize GitService:', error);
        }
    }

    /**
     * 웹뷰 상태를 동기화합니다.
     */
    private syncWebviewState(): void {
        this.translationViewProvider?.broadcastState({
            syncScrollEnabled: this.isSyncScrollEnabled,
            kubelingoEnabled: this.isKubelingoEnabled,
            mode: this.currentMode,
        });
    }

    /**
     * 현재 상태를 반환합니다.
     */
    getState(): {
        isSyncScrollEnabled: boolean;
        isKubelingoEnabled: boolean;
        currentMode: 'translation' | 'review';
    } {
        return {
            isSyncScrollEnabled: this.isSyncScrollEnabled,
            isKubelingoEnabled: this.isKubelingoEnabled,
            currentMode: this.currentMode,
        };
    }

    /**
     * VS Code 명령어를 등록합니다.
     */
    registerCommands(context: vscode.ExtensionContext): void {
        this.context = context;

        context.subscriptions.push(
            vscode.commands.registerCommand(
                'kubelingoassist.openTranslationFile', 
                (uri?: vscode.Uri) => this.openTranslationFile(uri)
            ),
            vscode.commands.registerCommand(
                'kubelingoassist.openReviewFile', 
                () => this.openReviewFile()
            ),
            vscode.commands.registerCommand(
                'kubelingoassist.toggleSyncScroll', 
                () => this.toggleSyncScroll()
            ),
            vscode.commands.registerCommand(
                'kubelingoassist.toggleKubelingo', 
                () => this.toggleKubelingo()
            ),
            vscode.commands.registerCommand(
                'kubelingoassist.changeMode', 
                (mode: 'translation' | 'review') => this.changeMode(mode)
            )
        );
    }

    /**
     * 번역 파일을 열고 분할 화면을 설정합니다.
     */
    private async openTranslationFile(uri?: vscode.Uri): Promise<void> {
        if (!this.isKubelingoEnabled) {
            i18n.showInformationMessage('messages.kubelingoDisabled');
            return;
        }

        if (this.gitService) {
            const isK8sRepo = await this.gitService.isKubernetesWebsiteRepository();
            if (!isK8sRepo) {
                i18n.showErrorMessage('messages.notKubernetesRepo');
                return;
            }
        }

        const filePath = this.getFilePath(uri);
        if (!filePath) {
            i18n.showErrorMessage('messages.noActiveFile');
            return;
        }

        const translationPath = await this.translationUtils.getTranslationPath(filePath);
        if (!translationPath) {
            i18n.showErrorMessage('messages.cannotFindTranslationPath');
            return;
        }

        await this.translationUtils.openSplitView(filePath, translationPath);
        await this.statusBarManager?.updateAllStatusBarItems(filePath, translationPath);
        this.syncWebviewState();
    }

    /**
     * 리뷰 파일을 엽니다.
     */
    private async openReviewFile(): Promise<void> {
        console.log('openReviewFileFileSelection called');

        if (!this.gitService) {
            console.log('Git utilities not available');
            i18n.showErrorMessage('messages.gitUtilitiesNotAvailable');
            return;
        }

        const isK8sRepo = await this.gitService.isKubernetesWebsiteRepository();
        if (!isK8sRepo) {
            i18n.showErrorMessage('messages.kubernetesRepoOnly');
            return;
        }

        try {
            const commitInfo = await this.getCommitInfoWithTranslationFiles();
            if (!commitInfo) {
                return;
            }

            const selectedFile = await this.showFileSelectionDialog(commitInfo);
            if (selectedFile) {
                console.log('Selected file for review:', selectedFile.filePath);
                await this.openFileInReviewMode(selectedFile.filePath);
            }
        } catch (error) {
            i18n.showErrorMessage('messages.failedToGetRecentCommits', { 
                error: String(error) 
            });
        }
    }

    /**
     * 스크롤 동기화를 토글합니다.
     */
    private toggleSyncScroll(): void {
        if (!this.isKubelingoEnabled) {
            i18n.showInformationMessage('messages.kubelingoDisabled');
            return;
        }

        this.isSyncScrollEnabled = !this.isSyncScrollEnabled;

        if (this.isSyncScrollEnabled) {
            this.scrollSyncManager.setupSynchronizedScrolling();
            i18n.showInformationMessage('messages.syncScrollEnabled');
        } else {
            this.scrollSyncManager.cleanupScrollListeners();
            i18n.showInformationMessage('messages.syncScrollDisabled');
        }

        this.saveStateAndBroadcast();
    }

    /**
     * Kubelingo 기능을 토글합니다.
     */
    private toggleKubelingo(): void {
        console.log('toggleKubelingo function called, current state:', this.isKubelingoEnabled);
        this.isKubelingoEnabled = !this.isKubelingoEnabled;
        console.log('toggleKubelingo new state:', this.isKubelingoEnabled);

        if (this.isKubelingoEnabled) {
            i18n.showInformationMessage('messages.kubelingoEnabled');
        } else {
            i18n.showInformationMessage('messages.kubelingoDisabledMsg');
            this.disableSyncScrollWhenKubelingoDisabled();
        }

        this.saveKubelingoState();
        this.syncWebviewState();
    }

    /**
     * 모드를 변경합니다.
     */
    private changeMode(mode: 'translation' | 'review'): void {
        if (!this.isKubelingoEnabled) {
            i18n.showInformationMessage('messages.kubelingoDisabled');
            return;
        }

        this.currentMode = mode;

        const messageKey = mode === 'review' 
            ? 'messages.reviewModeEnabled'
            : 'messages.translationModeEnabled';
        i18n.showInformationMessage(messageKey);

        this.saveModeState();
        this.syncWebviewState();
    }

    /**
     * 리뷰 모드에서 파일을 엽니다.
     */
    private async openFileInReviewMode(filePath: string): Promise<void> {
        if (!this.gitService) {
            i18n.showErrorMessage('messages.gitUtilitiesNotAvailable');
            return;
        }

        try {
            const originalEnglishPath = this.gitService.getOriginalEnglishPath(filePath);
            if (!originalEnglishPath) {
                i18n.showErrorMessage('messages.couldNotDetermineOriginalPath');
                return;
            }

            await this.translationUtils.openSplitView(originalEnglishPath, filePath);
            await this.statusBarManager?.updateAllStatusBarItems(originalEnglishPath, filePath);

            i18n.showInformationMessage('messages.openedForReview', { path: filePath });
        } catch (error) {
            i18n.showErrorMessage('messages.failedToOpenReviewMode', { 
                error: String(error) 
            });
        }
    }

    // Private helper methods

    private getFilePath(uri?: vscode.Uri): string | undefined {
        if (uri) {
            return uri.fsPath;
        }
        
        const currentEditor = vscode.window.activeTextEditor;
        return currentEditor?.document.uri.fsPath;
    }

    private async getCommitInfoWithTranslationFiles() {
        console.log('Getting recent commit info...');
        const commitInfo = await this.gitService!.getRecentCommit();
        console.log('Commit info:', commitInfo);

        if (!commitInfo) {
            console.log('No recent commits found');
            i18n.showErrorMessage('messages.noRecentCommits');
            return null;
        }

        console.log('All files in commit:', commitInfo.files.map(f => f.path));
        const translationFiles = this.gitService!.filterTranslationFiles(commitInfo.files);
        console.log('Filtered translation files:', translationFiles.map(f => f.path));

        if (translationFiles.length === 0) {
            console.log('No translation files found after filtering');
            i18n.showErrorMessage('messages.noTranslationFilesFound');
            return null;
        }

        return { ...commitInfo, files: translationFiles };
    }

    private async showFileSelectionDialog(commitInfo: any) {
        const quickPickItems = await Promise.all(
            commitInfo.files.map(async (file: any) => ({
                label: vscode.workspace.asRelativePath(file.absPath, false),
                description: this.getFileStatusDescription(file.status),
                detail: i18n.t('ui.fromCommit', { message: commitInfo.message }),
                filePath: file.absPath
            }))
        );

        return await i18n.showQuickPick(quickPickItems, {
            placeholderKey: 'ui.selectFileToReview',
            matchOnDescription: true,
            matchOnDetail: true
        });
    }

    private getFileStatusDescription(status: string): string {
        switch (status) {
            case 'M': return i18n.t('ui.fileStatus.modified');
            case 'A': return i18n.t('ui.fileStatus.added');
            default: return i18n.t('ui.fileStatus.other');
        }
    }

    private disableSyncScrollWhenKubelingoDisabled(): void {
        if (this.isSyncScrollEnabled) {
            this.isSyncScrollEnabled = false;
            this.scrollSyncManager.cleanupScrollListeners();
            this.context?.workspaceState.update(TranslationCommandManager.KEY_SYNC, this.isSyncScrollEnabled);
        }
    }

    private saveStateAndBroadcast(): void {
        this.context?.workspaceState.update(TranslationCommandManager.KEY_SYNC, this.isSyncScrollEnabled);
        this.syncWebviewState();
    }

    private saveKubelingoState(): void {
        this.context?.workspaceState.update(TranslationCommandManager.KEY_KUBELINGO, this.isKubelingoEnabled);
        console.log('Broadcasting state to webview:', {
            syncScrollEnabled: this.isSyncScrollEnabled,
            kubelingoEnabled: this.isKubelingoEnabled,
            mode: this.currentMode
        });
    }

    private saveModeState(): void {
        this.context?.workspaceState.update(TranslationCommandManager.KEY_MODE, this.currentMode);
    }

    /**
     * 리소스 정리를 위한 dispose 메서드
     */
    dispose(): void {
        this.scrollSyncManager.cleanupScrollListeners();
    }
}