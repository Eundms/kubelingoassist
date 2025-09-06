import * as vscode from 'vscode';
import { TranslationViewProvider } from '../features/ui/webview-providers';
import { StatusBarManager } from '../features/ui/status-bar';
import { CommandManager } from '../features/translation/CommandManager';
import { cleanupScrollListeners } from '../features/translation/ScrollSyncManager';
import { LinkValidator } from '../validators/link';
// import { AIManagerFactory } from '../features/ai';

let statusBarManager: StatusBarManager;
let linkValidator: LinkValidator;
let aiCommandManager: any;
let commandManager: CommandManager;

export function activate(context: vscode.ExtensionContext) {
    // Status bar manager 초기화
    statusBarManager = new StatusBarManager();
    
    // Link validator 초기화
    linkValidator = new LinkValidator();
    
    // AI Command Manager 초기화
    // aiCommandManager = AIManagerFactory.getCommandManager(context);
    
    // Activity Bar 뷰 프로바이더 등록
    const provider = new TranslationViewProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('kubelingoassist-view', provider)
    );
    
    // Command Manager 초기화 및 등록
    commandManager = new CommandManager(context, statusBarManager, provider);
    commandManager.registerCommands();
    commandManager.initStateFromStorage();
    
    // AI Commands 등록
    aiCommandManager.registerCommands();
    
    // 문서 변경 시 링크 검증
    const onDidChangeTextDocument = vscode.workspace.onDidChangeTextDocument((event) => {
        linkValidator.validateLinks(event.document);
    });
    
    // 문서 열기 시 링크 검증
    const onDidOpenTextDocument = vscode.workspace.onDidOpenTextDocument((document) => {
        linkValidator.validateLinks(document);
    });
    
    context.subscriptions.push(
        ...statusBarManager.getItems(),
        linkValidator.getDiagnostics(),
        linkValidator.getCodeActionProvider(),
        onDidChangeTextDocument,
        onDidOpenTextDocument
    );
}

export function deactivate() {
    cleanupScrollListeners();
    if (statusBarManager) {
        statusBarManager.dispose();
    }
    if (linkValidator) {
        linkValidator.dispose();
    }
    if (commandManager) {
        // CommandManager에 dispose 메서드가 있다면 호출
    }
}