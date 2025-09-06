import * as vscode from 'vscode';

export interface LocalizationMessages {
  // Commands
  'commands.kubelingo.disabled': string;
  'commands.kubelingo.enabled': string;
  'commands.kubelingo.toggleSyncScroll.enabled': string;
  'commands.kubelingo.toggleSyncScroll.disabled': string;
  'commands.kubelingo.mode.translation': string;
  'commands.kubelingo.mode.review': string;
  'commands.openTranslationFile.noActiveFile': string;
  'commands.openTranslationFile.noTranslationPath': string;
  'commands.openTranslationFile.repositoryError': string;
  'commands.openReviewFile.gitNotAvailable': string;
  'commands.openReviewFile.noCommits': string;
  'commands.openReviewFile.noTranslationFiles': string;
  'commands.openReviewFile.pickPlaceholder': string;
  'commands.openReviewFile.commitFrom': string;
  'commands.openReviewFile.status.modified': string;
  'commands.openReviewFile.status.added': string;
  'commands.openReviewFile.status.other': string;
  'commands.openReviewFile.opened': string;
  'commands.openReviewFile.failed': string;
  'commands.openReviewFile.noOriginalPath': string;
  
  // Scroll sync
  'scrollSync.insufficientFiles': string;
  
  // Git utils
  'git.fetchFailed': string;
  'git.commitInfoFailed': string;
  'git.diffFailed': string;
  
  // Translation path
  'translationPath.invalidPath': string;
  'translationPath.notContentPath': string;
  'translationPath.unsupportedStructure': string;
  'translationPath.unsupportedLanguage': string;
  'translationPath.selectLanguage': string;
  
  // Translation file
  'translationFile.splitViewOpened': string;
  'translationFile.originalNotFound': string;
  'translationFile.created': string;
  'translationFile.creationFailed': string;
  'translationFile.invalidPaths': string;
  'translationFile.notFound': string;
  'translationFile.create': string;
  'translationFile.cancel': string;
  'translationFile.alreadyExists': string;
  'translationFile.overwrite': string;
  
  // AI Service
  'ai.provider.unsupported': string;
  'ai.provider.select': string;
  'ai.apiKey.notFound': string;
  'ai.apiKey.saved': string;
  'ai.apiKey.deleted': string;
  'ai.apiKey.failed': string;
  'ai.apiKey.configure': string;
  'ai.apiKey.status': string;
  'ai.apiKey.configured': string;
  'ai.apiKey.notConfigured': string;
  'ai.translation.failed': string;
  'ai.translation.completed': string;
  'ai.translation.translating': string;
  'ai.translation.noText': string;
  'ai.translation.noEditor': string;
  'ai.translation.selectLanguage': string;
}

const messages: Record<string, LocalizationMessages> = {
  'en': {
    // Commands
    'commands.kubelingo.disabled': 'KubelingoAssist is disabled. Please enable it first.',
    'commands.kubelingo.enabled': 'KubelingoAssist enabled.',
    'commands.kubelingo.toggleSyncScroll.enabled': 'Synchronized scrolling is enabled.',
    'commands.kubelingo.toggleSyncScroll.disabled': 'Synchronized scrolling is disabled.',
    'commands.kubelingo.mode.translation': 'Translation mode enabled.',
    'commands.kubelingo.mode.review': 'Review mode enabled. You can now see changed files from recent commits.',
    'commands.openTranslationFile.noActiveFile': 'No active file found.',
    'commands.openTranslationFile.noTranslationPath': 'Translation file path not found. This extension works with Kubernetes documentation repository /content/en/ or /content/{language}/ structure.',
    'commands.openTranslationFile.repositoryError': 'This extension only works with the Kubernetes documentation repository (kubernetes/website). Please open the kubernetes/website repository to use translation features.',
    'commands.openReviewFile.gitNotAvailable': 'Git utilities not available',
    'commands.openReviewFile.noCommits': 'No recent commits found',
    'commands.openReviewFile.noTranslationFiles': 'No translation files found in recent commits. This extension works with Kubernetes documentation repositories that have content/{language} structure. Make sure you have committed some translated markdown files in the expected directory structure.',
    'commands.openReviewFile.pickPlaceholder': 'Select a translation file to review',
    'commands.openReviewFile.commitFrom': 'From commit: {0}',
    'commands.openReviewFile.status.modified': 'Modified',
    'commands.openReviewFile.status.added': 'Added',
    'commands.openReviewFile.status.other': 'Other',
    'commands.openReviewFile.opened': 'Opened {0} with original English file for review',
    'commands.openReviewFile.failed': 'Failed to open file in review mode: {0}',
    'commands.openReviewFile.noOriginalPath': 'Could not determine original English file path',
    
    // Scroll sync
    'scrollSync.insufficientFiles': 'Insufficient translation files for synchronization. Please open both original and translation files.',
    
    // Git utils
    'git.fetchFailed': 'Failed to fetch repository information: {0}',
    'git.commitInfoFailed': 'Failed to get recent commit information: {0}',
    'git.diffFailed': 'Failed to get diff information: {0}',
    
    // Translation path
    'translationPath.invalidPath': 'Invalid file path provided',
    'translationPath.notContentPath': 'Path does not contain /content/ directory',
    'translationPath.unsupportedStructure': 'Path does not match expected content structure',
    'translationPath.unsupportedLanguage': 'Unsupported language code: {0}',
    'translationPath.selectLanguage': 'Select target language for translation',
    
    // Translation file
    'translationFile.splitViewOpened': 'Split view opened. Use Cmd+Shift+S to enable scroll synchronization.',
    'translationFile.originalNotFound': 'Original file not found: {0}',
    'translationFile.created': 'Translation file created successfully! Start translating.',
    'translationFile.creationFailed': 'Failed to create translation file: {0}',
    'translationFile.invalidPaths': 'Invalid file paths provided',
    'translationFile.notFound': 'Translation file not found. Would you like to create it?',
    'translationFile.create': 'Create',
    'translationFile.cancel': 'Cancel',
    'translationFile.alreadyExists': 'Translation file already exists: {0}\nDo you want to overwrite it?',
    'translationFile.overwrite': 'Overwrite',
    
    // AI Service
    'ai.provider.unsupported': 'Unsupported AI provider: {0}',
    'ai.provider.select': 'Current provider: {0}. Select API provider to configure:',
    'ai.apiKey.notFound': 'No API key configured for {0}',
    'ai.apiKey.saved': '{0} API Key saved securely.',
    'ai.apiKey.deleted': '{0} API Key deleted.',
    'ai.apiKey.failed': 'Failed to save API key: {0}',
    'ai.apiKey.configure': 'Configure API Key',
    'ai.apiKey.status': 'API Key Status:\n{0}',
    'ai.apiKey.configured': '✓ Configured',
    'ai.apiKey.notConfigured': '✗ Not configured',
    'ai.translation.failed': 'Translation failed: {0}',
    'ai.translation.completed': 'Translation completed!',
    'ai.translation.translating': 'Translating...',
    'ai.translation.noText': 'No text selected',
    'ai.translation.noEditor': 'No active editor',
    'ai.translation.selectLanguage': 'Enter target language (e.g., Korean, Japanese, Spanish)',
  },
  'ko': {
    // Commands
    'commands.kubelingo.disabled': 'KubelingoAssist가 비활성화되어 있습니다. 먼저 활성화해주세요.',
    'commands.kubelingo.enabled': 'KubelingoAssist가 활성화되었습니다.',
    'commands.kubelingo.toggleSyncScroll.enabled': '동기화 스크롤이 활성화되었습니다.',
    'commands.kubelingo.toggleSyncScroll.disabled': '동기화 스크롤이 비활성화되었습니다.',
    'commands.kubelingo.mode.translation': '번역 모드가 활성화되었습니다.',
    'commands.kubelingo.mode.review': '리뷰 모드가 활성화되었습니다. 최근 커밋에서 변경된 파일들을 확인할 수 있습니다.',
    'commands.openTranslationFile.noActiveFile': '활성화된 파일이 없습니다.',
    'commands.openTranslationFile.noTranslationPath': '번역 파일 경로를 찾을 수 없습니다. 이 확장 프로그램은 Kubernetes 문서 저장소의 /content/en/ 또는 /content/{언어}/ 구조에서 작동합니다.',
    'commands.openTranslationFile.repositoryError': '이 확장 프로그램은 Kubernetes 문서 저장소(kubernetes/website)에서만 작동합니다. kubernetes/website 저장소를 열어서 번역 기능을 사용해주세요.',
    'commands.openReviewFile.gitNotAvailable': 'Git 유틸리티를 사용할 수 없습니다',
    'commands.openReviewFile.noCommits': '최근 커밋을 찾을 수 없습니다',
    'commands.openReviewFile.noTranslationFiles': '최근 커밋에서 번역 파일을 찾을 수 없습니다. 이 확장 프로그램은 content/{언어} 구조를 가진 Kubernetes 문서 저장소에서 작동합니다. 예상된 디렉터리 구조에 번역된 마크다운 파일을 커밋했는지 확인해주세요.',
    'commands.openReviewFile.pickPlaceholder': '리뷰할 번역 파일을 선택하세요',
    'commands.openReviewFile.commitFrom': '커밋 출처: {0}',
    'commands.openReviewFile.status.modified': '수정됨',
    'commands.openReviewFile.status.added': '추가됨',
    'commands.openReviewFile.status.other': '기타',
    'commands.openReviewFile.opened': '리뷰를 위해 {0}을(를) 원본 영어 파일과 함께 열었습니다',
    'commands.openReviewFile.failed': '리뷰 모드에서 파일을 여는데 실패했습니다: {0}',
    'commands.openReviewFile.noOriginalPath': '원본 영어 파일 경로를 확인할 수 없습니다',
    
    // Scroll sync
    'scrollSync.insufficientFiles': '동기화할 번역 파일이 부족합니다. 원본과 번역 파일을 모두 열어주세요.',
    
    // Git utils
    'git.fetchFailed': '저장소 정보를 가져오는데 실패했습니다: {0}',
    'git.commitInfoFailed': '최근 커밋 정보를 가져오는데 실패했습니다: {0}',
    'git.diffFailed': 'diff 정보를 가져오는데 실패했습니다: {0}',
    
    // Translation path
    'translationPath.invalidPath': '유효하지 않은 파일 경로입니다',
    'translationPath.notContentPath': '경로에 /content/ 디렉터리가 포함되어 있지 않습니다',
    'translationPath.unsupportedStructure': '예상된 콘텐츠 구조와 일치하지 않는 경로입니다',
    'translationPath.unsupportedLanguage': '지원되지 않는 언어 코드입니다: {0}',
    'translationPath.selectLanguage': '번역할 대상 언어를 선택하세요',
    
    // Translation file
    'translationFile.splitViewOpened': 'Split view로 파일을 열었습니다. Cmd+Shift+S로 스크롤 동기화를 활성화하세요.',
    'translationFile.originalNotFound': '원본 파일이 존재하지 않습니다: {0}',
    'translationFile.created': '번역 파일이 성공적으로 생성되었습니다! 번역을 시작하세요.',
    'translationFile.creationFailed': '번역 파일 생성에 실패했습니다: {0}',
    'translationFile.invalidPaths': '유효하지 않은 파일 경로입니다',
    'translationFile.notFound': '번역 파일이 존재하지 않습니다. 새로 생성하시겠습니까?',
    'translationFile.create': '생성',
    'translationFile.cancel': '취소',
    'translationFile.alreadyExists': '번역 파일이 이미 존재합니다: {0}\n덮어쓰시겠습니까?',
    'translationFile.overwrite': '덮어쓰기',
    
    // AI Service
    'ai.provider.unsupported': '지원되지 않는 AI 제공업체입니다: {0}',
    'ai.provider.select': '현재 제공업체: {0}. 설정할 API 제공업체를 선택하세요:',
    'ai.apiKey.notFound': '{0}에 대한 API 키가 설정되지 않았습니다',
    'ai.apiKey.saved': '{0} API 키가 안전하게 저장되었습니다.',
    'ai.apiKey.deleted': '{0} API 키가 삭제되었습니다.',
    'ai.apiKey.failed': 'API 키 저장에 실패했습니다: {0}',
    'ai.apiKey.configure': 'API 키 설정',
    'ai.apiKey.status': 'API 키 상태:\n{0}',
    'ai.apiKey.configured': '✓ 설정됨',
    'ai.apiKey.notConfigured': '✗ 설정되지 않음',
    'ai.translation.failed': '번역에 실패했습니다: {0}',
    'ai.translation.completed': '번역이 완료되었습니다!',
    'ai.translation.translating': '번역 중...',
    'ai.translation.noText': '선택된 텍스트가 없습니다',
    'ai.translation.noEditor': '활성 편집기가 없습니다',
    'ai.translation.selectLanguage': '대상 언어를 입력하세요 (예: Korean, Japanese, Spanish)',
  }
};

export class I18nManager {
  private locale: string;
  
  constructor() {
    this.locale = vscode.env.language.startsWith('ko') ? 'ko' : 'en';
  }
  
  public t(key: keyof LocalizationMessages, ...args: string[]): string {
    const message = messages[this.locale]?.[key] ?? messages['en'][key];
    return this.formatMessage(message, args);
  }
  
  private formatMessage(message: string, args: string[]): string {
    return message.replace(/\{(\d+)\}/g, (match, index) => {
      const argIndex = parseInt(index, 10);
      return args[argIndex] ?? match;
    });
  }
  
  public setLocale(locale: string): void {
    this.locale = locale;
  }
  
  public getLocale(): string {
    return this.locale;
  }
}

// 싱글톤 인스턴스
export const i18n = new I18nManager();