import * as vscode from 'vscode';
import * as path from 'path';

export async function getTranslationPath(filePath: string): Promise<string | null> {
    const normalizedPath = filePath.replace(/\\\\/g, '/');
    
    // 영어 파일에서 번역 파일로
    if (normalizedPath.includes('/content/en/docs/')) {
        const targetLanguage = await selectTargetLanguage();
        if (!targetLanguage) return null;
        
        return normalizedPath.replace('/content/en/docs/', `/content/${targetLanguage}/docs/`);
    }
    
    // 번역 파일에서 영어 파일로
    const langMatch = normalizedPath.match(/\/content\/([^/]+)\/docs\//);
    if (langMatch && langMatch[1] !== 'en') {
        return normalizedPath.replace(`/content/${langMatch[1]}/docs/`, '/content/en/docs/');
    }
    
    return null;
}

export async function selectTargetLanguage(): Promise<string | null> {
    // 쿠버네티스에서 지원하는 언어 목록
    const languages = [
        { label: '한국어 (ko)', value: 'ko' },
        { label: '日本語 (ja)', value: 'ja' },
        { label: '中文 (zh-cn)', value: 'zh-cn' },
        { label: '中文 (zh)', value: 'zh' },
        { label: 'Français (fr)', value: 'fr' },
        { label: 'Deutsch (de)', value: 'de' },
        { label: 'Español (es)', value: 'es' },
        { label: 'Italiano (it)', value: 'it' },
        { label: 'Português (pt-br)', value: 'pt-br' },
        { label: 'Русский (ru)', value: 'ru' },
        { label: 'Українська (uk)', value: 'uk' },
        { label: 'Polski (pl)', value: 'pl' },
        { label: 'हिन्दी (hi)', value: 'hi' },
        { label: 'Việt Nam (vi)', value: 'vi' },
        { label: 'Indonesia (id)', value: 'id' }
    ];
    
    const selected = await vscode.window.showQuickPick(languages, {
        placeHolder: '번역할 대상 언어를 선택하세요',
        matchOnDescription: true
    });
    
    return selected?.value || null;
}

export async function openSplitView(originalPath: string, translationPath: string) {
    try {
        // 원본 파일을 왼쪽에 열기
        const originalUri = vscode.Uri.file(originalPath);
        await vscode.commands.executeCommand('vscode.open', originalUri, { viewColumn: vscode.ViewColumn.One });
        
        // 번역 파일을 오른쪽에 열기
        const translationUri = vscode.Uri.file(translationPath);
        await vscode.commands.executeCommand('vscode.open', translationUri, { viewColumn: vscode.ViewColumn.Two });
        
        vscode.window.showInformationMessage('Split view로 파일을 열었습니다. Cmd+Shift+S로 스크롤 동기화를 활성화하세요.');
        
    } catch (error) {
        // 번역 파일이 없으면 생성할지 물어보기
        const createFile = await vscode.window.showWarningMessage(
            '번역 파일이 존재하지 않습니다. 새로 생성하시겠습니까?',
            '생성',
            '취소'
        );
        
        if (createFile === '생성') {
            await createTranslationFile(originalPath, translationPath);
        }
    }
}

export async function createTranslationFile(originalPath: string, translationPath: string) {
    try {
        // 디렉토리 생성
        const dir = path.dirname(translationPath);
        await vscode.workspace.fs.createDirectory(vscode.Uri.file(dir));
        
        // 원본 파일을 그대로 복사
        await vscode.workspace.fs.copy(
            vscode.Uri.file(originalPath),
            vscode.Uri.file(translationPath),
            { overwrite: false }
        );
        
        vscode.window.showInformationMessage('파일을 복사했습니다. 번역을 시작하세요!');
        
        // Split view로 열기
        await openSplitView(originalPath, translationPath);
        
    } catch (error) {
        vscode.window.showErrorMessage(`파일 복사 실패: ${error}`);
    }
}

export function extractLanguage(filePath: string): string {
    const langMatch = filePath.match(/\/content\/([^/]+)\/docs\//);
    if (langMatch) {
        const langCode = langMatch[1];
        const languageNames: { [key: string]: string } = {
            'en': 'English',
            'ko': '한국어',
            'ja': '日本語',
            'zh-cn': '中文(简体)',
            'zh': '中文(繁体)',
            'fr': 'Français',
            'de': 'Deutsch',
            'es': 'Español',
            'it': 'Italiano',
            'pt-br': 'Português',
            'ru': 'Русский',
            'uk': 'Українська',
            'pl': 'Polski',
            'hi': 'हिन्दी',
            'vi': 'Việt Nam',
            'id': 'Indonesia'
        };
        return languageNames[langCode] || langCode.toUpperCase();
    }
    return 'Unknown';
}

export function extractLanguageCode(filePath: string): string {
    const langMatch = filePath.match(/\/content\/([^/]+)\/docs\//);
    return langMatch ? langMatch[1] : 'unknown';
}

export async function compareLineCounts(originalPath: string, translationPath: string): Promise<{
    originalLines: number;
    translationLines: number;
    isEqual: boolean;
    percentage: number;
} | null> {
    try {
        // 파일이 존재하는지 확인
        const originalExists = await vscode.workspace.fs.stat(vscode.Uri.file(originalPath)).then(() => true, () => false);
        const translationExists = await vscode.workspace.fs.stat(vscode.Uri.file(translationPath)).then(() => true, () => false);
        
        if (!originalExists || !translationExists) {
            return null;
        }

        // 파일 내용 읽기
        const originalContent = await vscode.workspace.fs.readFile(vscode.Uri.file(originalPath));
        const translationContent = await vscode.workspace.fs.readFile(vscode.Uri.file(translationPath));
        
        // 라인 수 계산
        const originalLines = originalContent.toString().split('\n').length;
        const translationLines = translationContent.toString().split('\n').length;
        
        return {
            originalLines,
            translationLines,
            isEqual: originalLines === translationLines,
            percentage: originalLines > 0 ? Math.round((translationLines / originalLines) * 100) : 0
        };
    } catch (error) {
        console.error('Error comparing line counts:', error);
        return null;
    }
}