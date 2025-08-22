import * as vscode from 'vscode';
import { TranslationViewProvider } from './webview-providers';
import { StatusBarManager } from './status-bar';
import { registerCommands, setDependencies, initStateFromStorage } from './commands';
import { cleanupScrollListeners } from './scroll-sync';
import { LinkValidator } from './validator/link';

let statusBarManager: StatusBarManager;
let linkValidator: LinkValidator;

export function activate(context: vscode.ExtensionContext) {
    // Status bar manager 초기화
    statusBarManager = new StatusBarManager();
    
    // Link validator 초기화
    linkValidator = new LinkValidator();
    
    // Activity Bar 뷰 프로바이더 등록
    const provider = new TranslationViewProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('kubelingoassist-view', provider)
    );
    
    // Commands 모듈에 의존성 설정
    setDependencies(statusBarManager, provider);
    
    // Commands 등록
    registerCommands(context);
    
    // 저장된 상태로 초기화 (상태바, 웹뷰 동기화)
    initStateFromStorage(context);
    
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
}