import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { extractLanguageCode } from '../translation-utils';

export class LinkValidator {
    private diagnostics: vscode.DiagnosticCollection;
    private codeActionProvider: LinkCodeActionProvider;

    constructor() {
        this.diagnostics = vscode.languages.createDiagnosticCollection('kubelingoassist-links');
        this.codeActionProvider = new LinkCodeActionProvider();
    }

    public validateLinks(document: vscode.TextDocument): number {
        // 번역 파일만 체크 (en 제외)
        if (!this.isTranslationFile(document.uri.fsPath)) {
            this.diagnostics.delete(document.uri);
            return 0;
        }

        const currentLanguage = extractLanguageCode(document.uri.fsPath);
        const diagnostics: vscode.Diagnostic[] = [];
        const text = document.getText();

        // [텍스트](/docs/**) 패턴 찾기 (언어 코드가 없는 링크만)
        const linkRegex = /\[([^\]]*)\]\(\/docs\/([^)]*)\)/g;
        let match;

        while ((match = linkRegex.exec(text)) !== null) {
            const linkText = match[1];
            const linkPath = match[2];
            const fullMatch = match[0];
            
            // 이미 언어 코드가 있는 링크는 무시
            if (linkPath.match(/^[a-z]{2}\//) || linkPath.match(/^en\//)) {
                continue;
            }
            
            // 링크 위치 계산
            const startPos = document.positionAt(match.index);
            const endPos = document.positionAt(match.index + fullMatch.length);
            const range = new vscode.Range(startPos, endPos);

            // 실제 번역 파일 존재 여부 확인
            const expectedTranslationPath = this.getExpectedTranslationPath(document.uri.fsPath, linkPath, currentLanguage);
            const translationExists = expectedTranslationPath ? this.fileExists(expectedTranslationPath) : false;

            // 번역 파일이 있는 경우만 경고
            if (translationExists) {
                const isFolder = linkPath.endsWith('/');
                const resourceType = isFolder ? '폴더' : '파일';
                const suggestedPath = `/${currentLanguage.toLowerCase()}/docs/${linkPath}`;
                const message = `⚠️ 번역 ${resourceType}이 존재하는데 언어 경로가 누락되었습니다.\n` +
                              `현재: [${linkText}](/docs/${linkPath})\n` +
                              `권장: [${linkText}](${suggestedPath})`;
                const diagnostic = new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Warning);
                diagnostic.source = 'KubeLingoAssist';
                diagnostic.code = 'missing-language-path';
                diagnostics.push(diagnostic);
            }
        }

        // 진단 정보 설정
        this.diagnostics.set(document.uri, diagnostics);
        return diagnostics.length;
    }

    private isTranslationFile(filePath: string): boolean {
        // /content/{language}/docs/ 패턴이면서 en이 아니면서 기존 번역 파일이 존재하는 경우
        const match = filePath.match(/\/content\/([^/]+)\/docs\//);
        return match !== null && match[1] !== 'en' && this.existsTranslationFile(filePath);
    }

    public dispose() {
        this.diagnostics.dispose();
        this.codeActionProvider.dispose();
    }

    public getDiagnostics(): vscode.DiagnosticCollection {
        return this.diagnostics;
    }

    public getCodeActionProvider(): LinkCodeActionProvider {
        return this.codeActionProvider;
    }

    private existsTranslationFile(filePath: string): boolean {
        if (!fs.existsSync(filePath)) {
            return false;
        }
        
        const stats = fs.statSync(filePath);
        
        // 파일을 가리키는 경우 -> 파일 자체가 있는지 확인
        if (stats.isFile()) {
            return true;
        }
        
        // 디렉토리를 가리키는 경우 -> 디렉토리가 있는지 확인  
        if (stats.isDirectory()) {
            return true;
        }
        
        return false;
    }

    private getExpectedTranslationPath(currentFilePath: string, linkPath: string, language: string): string | null {
        // 현재 파일의 프로젝트 루트 찾기
        const contentMatch = currentFilePath.match(/(.*\/content)\//);
        if (!contentMatch) {
            return null;
        }

        const contentRoot = contentMatch[1];
        // /docs/concepts/overview.md -> /content/{lang}/docs/concepts/overview.md
        let expectedPath = path.join(contentRoot, language.toLowerCase(), 'docs', linkPath);
        
        // 폴더 링크인 경우 (/ 로 끝남)
        if (linkPath.endsWith('/')) {
            return expectedPath;
        }
        
        // 파일 링크인 경우 - .md 확장자가 없다면 추가
        if (!expectedPath.endsWith('.md')) {
            expectedPath += '.md';
        }
        
        return expectedPath;
    }

    private fileExists(filePath: string): boolean {
        try {
            if (!fs.existsSync(filePath)) {
                return false;
            }
            
            const stats = fs.statSync(filePath);
            
            // 폴더 링크인 경우 (경로가 / 로 끝남)
            if (filePath.endsWith('/')) {
                return stats.isDirectory();
            }
            
            // 파일 링크인 경우
            return stats.isFile();
        } catch {
            return false;
        }
    }
}

export class LinkCodeActionProvider implements vscode.CodeActionProvider {
    private disposables: vscode.Disposable[] = [];

    constructor() {
        // Register the code action provider for markdown files
        this.disposables.push(
            vscode.languages.registerCodeActionsProvider('markdown', this, {
                providedCodeActionKinds: [vscode.CodeActionKind.QuickFix]
            })
        );
    }

    provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range | vscode.Selection,
        context: vscode.CodeActionContext,
        token: vscode.CancellationToken
    ): vscode.CodeAction[] {
        const codeActions: vscode.CodeAction[] = [];

        // Check if any of the diagnostics are from our link validator
        const linkDiagnostics = context.diagnostics.filter(
            d => d.source === 'KubeLingoAssist' && d.code === 'missing-language-path'
        );

        for (const diagnostic of linkDiagnostics) {
            const action = this.createFixLanguagePathAction(document, diagnostic);
            if (action) {
                codeActions.push(action);
            }
        }

        return codeActions;
    }

    private createFixLanguagePathAction(
        document: vscode.TextDocument,
        diagnostic: vscode.Diagnostic
    ): vscode.CodeAction | undefined {
        // Extract the link information from the diagnostic range
        const text = document.getText(diagnostic.range);
        const linkRegex = /\[([^\]]*)\]\(\/docs\/([^)]*)\)/;
        const match = text.match(linkRegex);

        if (!match) {
            return undefined;
        }

        const linkText = match[1];
        const linkPath = match[2];
        const currentLanguage = extractLanguageCode(document.uri.fsPath);

        if (currentLanguage === 'unknown') {
            return undefined;
        }

        const suggestedPath = `/${currentLanguage.toLowerCase()}/docs/${linkPath}`;
        const newLinkText = `[${linkText}](${suggestedPath})`;

        const action = new vscode.CodeAction(
            `언어 경로 추가: /${currentLanguage}/docs/...`,
            vscode.CodeActionKind.QuickFix
        );

        action.edit = new vscode.WorkspaceEdit();
        action.edit.replace(document.uri, diagnostic.range, newLinkText);

        action.diagnostics = [diagnostic];
        action.isPreferred = true;

        return action;
    }

    dispose() {
        this.disposables.forEach(d => d.dispose());
    }
}