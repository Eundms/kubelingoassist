import * as vscode from 'vscode';
import * as path from 'path';

/**
 * 주어진 파일 경로에서 번역 파일의 경로를 생성합니다.
 * 영어 파일의 경우 대상 언어의 번역 파일 경로를 반환하고,
 * 번역 파일의 경우 원본 영어 파일 경로를 반환합니다.
 * 모든 쿠버네티스 컨텐츠 유형(docs, blog, case-studies 등)을 지원합니다.
 * 
 * @param filePath - 변환할 파일의 절대 경로
 * @returns 번역 파일 경로 또는 null (변환할 수 없는 경우)
 * 
 * @example
 * ```typescript
 * // 영어 파일에서 한국어 번역 파일로
 * await getTranslationPath('/content/en/docs/concepts/overview.md')
 * // Returns: '/content/ko/docs/concepts/overview.md'
 * 
 * await getTranslationPath('/content/en/blog/2024/news.md')
 * // Returns: '/content/ko/blog/2024/news.md'
 * 
 * // 번역 파일에서 영어 원본 파일로
 * getTranslationPath('/content/ko/case-studies/example.md')
 * // Returns: '/content/en/case-studies/example.md'
 * ```
 */
export async function getTranslationPath(filePath: string): Promise<string | null> {
    if (!filePath || typeof filePath !== 'string') {
        console.warn('getTranslationPath: Invalid file path provided');
        return null;
    }

    const normalizedPath = filePath.replace(/\\\\/g, '/');
    
    // 쿠버네티스 컨텐츠 경로인지 확인
    if (!normalizedPath.includes('/content/')) {
        console.warn('getTranslationPath: Path does not contain /content/ directory');
        return null;
    }
    
    // 영어 파일에서 번역 파일로
    if (normalizedPath.includes('/content/en/')) {
        const targetLanguage = await selectTargetLanguage();
        if (!targetLanguage) {
            console.log('getTranslationPath: User cancelled language selection');
            return null;
        }
        
        return normalizedPath.replace('/content/en/', `/content/${targetLanguage}/`);
    }
    
    // 번역 파일에서 영어 파일로
    const langMatch = normalizedPath.match(/\/content\/([^/]+)\//); 
    if (langMatch && langMatch[1] !== 'en') {
        // 지원되는 언어 코드인지 확인
        const supportedLanguages = ['ko', 'ja', 'zh-cn', 'zh', 'fr', 'de', 'es', 'it', 'pt-br', 'ru', 'uk', 'pl', 'hi', 'vi', 'id'];
        const detectedLang = langMatch[1];
        
        if (!supportedLanguages.includes(detectedLang)) {
            console.warn(`getTranslationPath: Unsupported language code: ${detectedLang}`);
            return null;
        }
        
        return normalizedPath.replace(`/content/${detectedLang}/`, '/content/en/');
    }
    
    console.warn('getTranslationPath: Path does not match expected content structure');
    return null;
}

/**
 * 사용자에게 번역 대상 언어를 선택하도록 하는 VS Code Quick Pick을 표시합니다.
 * 쿠버네티스 공식 문서에서 지원하는 언어 목록을 제공합니다.
 * 
 * @returns 선택된 언어 코드 (예: 'ko', 'ja') 또는 null (취소된 경우)
 * 
 * @example
 * ```typescript
 * const language = await selectTargetLanguage();
 * if (language === 'ko') {
 *   console.log('한국어가 선택되었습니다');
 * }
 * ```
 */
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

/**
 * 원본 파일과 번역 파일을 Split View로 엽니다.
 * 원본 파일은 왼쪽(ViewColumn.One), 번역 파일은 오른쪽(ViewColumn.Two)에 표시됩니다.
 * 번역 파일이 존재하지 않는 경우 생성할지 사용자에게 확인합니다.
 * 
 * @param originalPath - 원본 파일의 절대 경로
 * @param translationPath - 번역 파일의 절대 경로
 * 
 * @throws VS Code API 호출 중 오류가 발생한 경우
 * 
 * @example
 * ```typescript
 * await openSplitView(
 *   '/workspace/content/en/docs/concepts/overview.md',
 *   '/workspace/content/ko/docs/concepts/overview.md'
 * );
 * ```
 */
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

/**
 * 원본 파일을 복사하여 새로운 번역 파일을 생성합니다.
 * 필요한 디렉토리 구조를 자동으로 생성하고, 원본 내용을 그대로 복사합니다.
 * 생성 완료 후 자동으로 Split View를 엽니다.
 * 
 * @param originalPath - 복사할 원본 파일의 절대 경로
 * @param translationPath - 생성할 번역 파일의 절대 경로
 * 
 * @throws 파일 시스템 작업 중 오류가 발생한 경우 (권한 부족, 디스크 공간 부족 등)
 * 
 * @example
 * ```typescript
 * await createTranslationFile(
 *   '/workspace/content/en/blog/announcement.md',
 *   '/workspace/content/ko/blog/announcement.md'
 * );
 * ```
 */
export async function createTranslationFile(originalPath: string, translationPath: string) {
    if (!originalPath || !translationPath) {
        vscode.window.showErrorMessage('파일 경로가 유효하지 않습니다.');
        return;
    }

    try {
        // 원본 파일 존재 여부 확인
        const originalExists = await vscode.workspace.fs.stat(vscode.Uri.file(originalPath))
            .then(() => true, () => false);
            
        if (!originalExists) {
            vscode.window.showErrorMessage(`원본 파일이 존재하지 않습니다: ${originalPath}`);
            return;
        }
        
        // 번역 파일이 이미 존재하는지 확인
        const translationExists = await vscode.workspace.fs.stat(vscode.Uri.file(translationPath))
            .then(() => true, () => false);
            
        if (translationExists) {
            const overwrite = await vscode.window.showWarningMessage(
                `번역 파일이 이미 존재합니다: ${path.basename(translationPath)}\n덕어쓰시겠습니까?`,
                '덤어쓰기',
                '취소'
            );
            
            if (overwrite !== '덤어쓰기') {
                return;
            }
        }
        
        // 디렉토리 생성 (재귀적으로)
        const dir = path.dirname(translationPath);
        await vscode.workspace.fs.createDirectory(vscode.Uri.file(dir));
        
        // 빈 번역 파일 생성
        await vscode.workspace.fs.writeFile(
            vscode.Uri.file(translationPath),
            Buffer.from('', 'utf8')
        );

        vscode.window.showInformationMessage(`파일을 복사했습니다. 번역을 시작하세요!`);

        // Split view로 열기
        await openSplitView(originalPath, translationPath);
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('createTranslationFile error:', error);
        vscode.window.showErrorMessage(`파일 복사 실패: ${errorMessage}`);
    }
}

/**
 * 파일 경로에서 언어 코드를 추출하여 해당하는 언어명을 반환합니다.
 * 쿠버네티스 문서의 표준 경로 구조 (/content/{language}/)를 기준으로 합니다.
 * 
 * @param filePath - 언어를 추출할 파일의 절대 경로
 * @returns 언어명 (한국어, English 등) 또는 'Unknown' (인식할 수 없는 경우)
 * 
 * @example
 * ```typescript
 * extractLanguage('/content/ko/docs/concepts/overview.md')
 * // Returns: '한국어'
 * 
 * extractLanguage('/content/en/blog/post.md')
 * // Returns: 'English'
 * ```
 */
export function extractLanguage(filePath: string): string {
    const langMatch = filePath.match(/\/content\/([^/]+)\//); 
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

/**
 * 파일 경로에서 언어 코드만을 추출합니다.
 * 쿠버네티스 문서의 표준 경로 구조 (/content/{language}/)를 기준으로 합니다.
 * 
 * @param filePath - 언어 코드를 추출할 파일의 절대 경로
 * @returns 언어 코드 (ko, en, ja 등) 또는 'unknown' (인식할 수 없는 경우)
 * 
 * @example
 * ```typescript
 * extractLanguageCode('/content/ko/docs/concepts/overview.md')
 * // Returns: 'ko'
 * 
 * extractLanguageCode('/content/zh-cn/blog/post.md')
 * // Returns: 'zh-cn'
 * ```
 */
export function extractLanguageCode(filePath: string): string {
    const langMatch = filePath.match(/\/content\/([^/]+)\//); 
    return langMatch ? langMatch[1] : 'unknown';
}

/**
 * 원본 파일과 번역 파일의 라인 수를 비교하여 번역 진행률을 계산합니다.
 * 파일이 존재하지 않거나 읽기에 실패한 경우 null을 반환합니다.
 * 
 * @param originalPath - 원본 파일의 절대 경로
 * @param translationPath - 번역 파일의 절대 경로
 * @returns 라인 수 비교 결과 객체 또는 null (파일이 없거나 오류 발생시)
 * 
 * @example
 * ```typescript
 * const result = await compareLineCounts(
 *   '/content/en/docs/concepts/overview.md',
 *   '/content/ko/docs/concepts/overview.md'
 * );
 * 
 * if (result) {
 *   console.log(`번역 진행률: ${result.percentage}%`);
 *   console.log(`원본: ${result.originalLines}줄, 번역: ${result.translationLines}줄`);
 * }
 * ```
 */
export async function compareLineCounts(originalPath: string, translationPath: string): Promise<{
    /** 원본 파일의 총 라인 수 */
    originalLines: number;
    /** 번역 파일의 총 라인 수 */
    translationLines: number;
    /** 원본과 번역 파일의 라인 수가 동일한지 여부 */
    isEqual: boolean;
    /** 번역 진행률 (번역 라인 수 / 원본 라인 수 * 100, 반올림) */
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